//var nodemailer = require('nodemailer');
//var smtpTransport = require('nodemailer-smtp-transport');
config = require("./config");
tools = require("./tools");
eventEmitter = require("./events");
var db = require("./db");
var mongoose = db.mongoose();

var dbUsers = db.users();
var schemas = require("./schemas");
schemas = new schemas();
schemas.object();
schemas.accessGroup();
schemas.tplConfig();
schemas.objectVersion();
schemas.tempInvitation();
schemas.role();
var userFunctions = require("./userFunctions");
var user = new userFunctions();
var lang = require("./lang");
const AWS = require("aws-sdk");

var fs = require("fs");
var path = require("path");

const getParentsPath = async (curr, project) => {
  const parents = await getParents(curr, project);
  const pm = await dbUsers.model("project").findById(project).exec();
  let path = [pm.name];
  parents.forEach((a) => {
    path.push(a.name);
  });
  return path.join("/");
};

const createId = function () {
  return Math.random().toString(36).substring(7) + new Date().getTime();
};

const getParentsPathForS3 = async (curr, project) => {
  const parents = await getParents(curr, project);
  const pm = await dbUsers.model("project").findById(project).exec();
  let path = [pm.name];
  parents.forEach((a) => {
    path.push(a.name);
  });
  return path.join("/");
};

const getParents = async (curr, projectId) => {
  const arr = await _getParents(curr, projectId);
  return arr.reverse();
};

const _getFolder = async (objectId, projectId) => {
  const model = (await db.appConnect(projectId)).model("object");
  const projectmodel = dbUsers.model("project");
  if (typeof objectId !== "string") {
    objectId = objectId._id;
  }
  return await model
    .findById(objectId)
    .populate("project", undefined, projectmodel)
    .exec();
};

const _getParents = async (curr, projectId) => {
  return new Promise(async (resolve) => {
    const result = [];
    while (curr) {
      const folder = await _getFolder(curr, projectId);
      result.push(folder);
      curr = folder.folder;
    }
    resolve(result);
  });
};

const s3Clone = async (objectOrId, connection) => {
  const model = connection.model("object");
  const objectVersion = connection.model("objectVersion");
  if (typeof objectOrId === "string") {
    objectOrId = await model
      .findById(objectOrId)
      .populate("versions", undefined, objectVersion);
  }
  return new Promise(async (resolve) => {
    const s3 = new AWS.S3(config.S3);

    let ext = objectOrId.versions[0].key
      ? objectOrId.versions[0].key.split(".").pop()
      : "";
    ext = ext ? "." + ext : "";

    const key = createId() + ext;

    const vr = objectOrId.versions[0];

    let key2;

    if (objectOrId.versions[0].ckey) {
      let ext2 = objectOrId.versions[0].ckey.split(".").pop();
      ext2 = ext2 ? "." + ext2 : "";
      key2 = createId() + ext2;
    }

    const copyParams = {
      Bucket: config.S3Bucket,
      CopySource: config.S3Bucket + "/" + vr.key,
      Key: key,
    };

    s3.copyObject(copyParams, function (err, data) {
      if (err) {
        resolve({ error: err });
        return;
      }
      if (data) {
        const orig = {
          key: key,
          etag: data.CopyObjectResult.ETag,
          location: vr.location.split(vr.key)[0] + key,
        };
        if (vr.ckey) {
          const copyPreviewParams = {
            Bucket: config.S3Bucket,
            CopySource: config.S3Bucket + "/" + vr.ckey,
            Key: key2,
          };
          s3.copyObject(copyPreviewParams, function (err, data2) {
            if (err) {
              resolve({
                error: err,
              });
            } else {
              resolve({
                ...orig,
                ckey: key2,
                cetag: data2.CopyObjectResult.ETag,
                clocation: vr.location.split(vr.key)[0] + key2,
                ctype: vr.ctype,
              });
            }
          });
        } else {
          resolve(orig);
        }
      }
    });
  });
};

const doMove = async (config) => {
  /*
   *
   * {
   *   item: id: string or object,
   *   target: id string,
   *   author: id string,    *
   *   connection: connection,    *
   *   name? : string
   * }
   *
   *
   */

  const objects = config.connection.model("object");

  const curr = await objects.findById(config.item);

  curr.folder = config.target || null;

  if (config.name) {
    curr.name = config.name;
  }

  await curr.save();

  return curr;
};

const doClone = async (conf) => {
  /*
   *
   * {
   *   item: id: string or object,
   *   target: id string,
   *   author: id string,    *
   *   connection: connection to objects,    *
   *   name? : string
   * }
   *
   * */

  const clone = await systemClone(
    {
      item: conf.item,
      target: conf.target,
      author: conf.author,
      name: conf.name,
    },
    conf.connection
  );

  const storageClone = async (object) => {
    if (config.uploadMode === "server") {
      return await s3Clone(object, conf.connection);
    } else if (config.uploadMode === "s3") {
    }
  };

  const versions = conf.connection.model("objectVersion");
  if (clone.type === "folder") {
    await eachFileIn(clone._id, conf.connection, async (object) => {
      const sclone = await storageClone(object);
      const vrs = {
        ...sclone,
        author: conf.author,
        type: object.type,
        name: object.name,
      };
      const newVersion = await versions.create(vrs);
      object.versions = [newVersion];
      await object.save();
    });
  } else if (clone.type === "file") {
    const fileS3clone = await storageClone(clone);
    const vrs = {
      ...fileS3clone,
      author: clone.author,
      type: clone.type,
      name: clone.name,
      size: clone.size,
      mimeType: clone.mimeType,

      /*            ckey: clone.ckey,
            cetag: clone.cetag,
            clocation: clone.clocation,
            ctype: clone.ctype*/
    };
    const newVersion = await versions.create(vrs);
    clone.versions = [newVersion];
    await clone.save();
  }

  return clone;
};

const eachFileIn = async (rootId, connection, callback) => {
  console.log(connection.model);
  return new Promise(async (resolve) => {
    const model = connection.model("object");
    const objectVersion = connection.model("objectVersion");
    const children = await model
      .find({ folder: rootId })
      .populate("versions", undefined, objectVersion)
      .exec();
    for (let i = 0; i < children.length; i++) {
      if (children[i].type !== "folder") {
        callback.call(undefined, children[i]);
      } else {
        await eachFileIn(children[i]._id, connection, callback);
      }
    }
    resolve(true);
  });
};

const systemClone = async (config, connection) => {
  return new Promise(async (resolve) => {
    let data;
    const model = connection.model("object");
    const versions = connection.model("objectVersion");

    if (typeof config.item === "string") {
      data = await model
        .findById(config.item)
        .populate("versions", undefined, versions)
        .exec();
    } else {
      data = config.item;
    }
    const children = await model.find({ folder: data._id }).exec();

    data._doc._id = mongoose.Types.ObjectId();
    data.isNew = true;
    data.folder = config.target;
    data.date = new Date().toISOString();
    data.author = config.author;
    if (config.name) {
      data.name = config.name;
    }
    let clonedDocument = await data.save();

    clonedDocument = await model
      .findById(clonedDocument._id)
      .populate("versions", undefined, versions);

    const all = [];

    if (children.length) {
      for (let i = 0; i < children.length; i++) {
        const curr = children[i];
        const ct = {
          item: curr,
          target: clonedDocument._id,
          author: config.author,
        };
        all.push(systemClone(ct, connection));
      }
      await Promise.all(all);
    }
    resolve(clonedDocument);
  });
};

module.exports = {
  doMove: doMove,
  s3Clone: s3Clone,
  eachFileIn: eachFileIn,
  doClone: doClone,
  getParents: getParents,
  getParentsPath: getParentsPath,
  getParentsPathForS3: getParentsPathForS3,
  S3CreateFolder: function (path, c) {
    path = path || "";
    if (!path) {
      return;
    }
    if (path.lastIndexOf("/") !== path.length - 1) {
      // path = path + '/';
    }
    return new Promise((resolve) => {
      const s3 = new AWS.S3(config.S3);
      const params = {
        Bucket: config.S3Bucket,
        Key: path, // "test/mest/guest/"
      };

      s3.putObject(params, function (err, data) {
        if (c) {
          c.call(undefined, data);
        }
        resolve(data);
      });
    });
  },
  S3DeleteObjects: function (todel, c) {
    const AWS = require("aws-sdk");
    var s3 = new AWS.S3(config.S3);

    var params = {
      Bucket: config.S3Bucket,
      Delete: {
        // required
        Objects: todel,
      },
    };
    s3.deleteObjects(params, function (err, s3data) {
      if (err) {
      } else {
        c.call();
      }
    });
  },
  deleteVersion: async function (id, c) {
    var scope = this;
    var versions = (await db.appConnect()).model("objectVersion");
    objects.findById(id, function (err, data) {
      if (data) {
        if (data.key) {
          //is S3
          var todel = [
            {
              Key: data.key,
            },
          ];
          scope.S3DeleteObjects(todel, function () {
            data.remove(function () {
              c.call();
            });
          });
        }
      }
    });
  },
  deleteVersions: async function (arr, projectId, c) {
    // ['id1', 'id2']

    var versions = (await db.appConnect(projectId)).model("objectVersion");
    var done = 0,
      max = arr.length;
    var scope = this;

    const project = await dbUsers.model("project").findById(projectId);

    versions
      .find({ _id: { $in: arr } })
      .select("+location")
      .exec(function (err, array) {
        var keys = [];
        const rootpath =
          __dirname + path.sep + config.serverUploadFolder + path.sep;
        array.forEach(function (item) {
          if (item.key) {
            keys.push({
              Key: item.key,
            });
          } else if (item.location) {
            if (fs.existsSync(rootpath + item.location)) {
              fs.unlinkSync(rootpath + item.location);
            }
          }
          if (item.ckey) {
            keys.push({
              Key: item.ckey,
            });
          } else if (item.clocation) {
            if (fs.existsSync(rootpath + item.clocation)) {
              fs.unlinkSync(rootpath + item.clocation);
            }
          }
        });
        if (keys.length) {
          scope.S3DeleteObjects(keys, function () {
            array.forEach(function (item) {
              project.totalVersions -= 1;
              project.totalSize -= item.size;
              item.remove(function () {
                done++;
                if (max === done) {
                  project.save(function () {
                    c.call();
                  });
                }
              });
            });
          });
        } else {
          c.call();
        }
      });
  },
  deleteObject: async function (id, projectId, c) {
    var objects = (await db.appConnect(projectId)).model("object");
    var project = await dbUsers.model("project").findById(projectId).exec();
    var scope = this;
    objects.findById(id, function (err, data) {
      if (!err) {
        if (data) {
          if (config.physicalDelete) {
            if (data.type === "folder") {
              var fid = data._id;
              data.remove(function (err1, data2) {
                project.totalFolders -= 1;
                project.save(function () {
                  objects.find({ folder: fid }, function (err, array) {
                    if (array.length) {
                      let done = 0,
                        i = 0;
                      for (; i < array.length; i++) {
                        scope.deleteObject(
                          array[i]._id,
                          projectId,
                          function () {
                            done++;
                            if (done === array.length) {
                              eventEmitter.emit("objectDeleted", id);
                              c.call(undefined, err1, data);
                            }
                          }
                        );
                      }
                    } else {
                      if (!err1) {
                        eventEmitter.emit("objectDeleted", id);
                      }
                      c.call(undefined, err1, data);
                    }
                  });
                });
              });
            } else {
              scope.deleteVersions(data.versions, projectId, function () {
                data.remove(function (err, data) {
                  if (!err) {
                    project.totalFiles -= 1;
                    project.save(function () {
                      eventEmitter.emit("objectDeleted", id);
                    });
                  }
                  c.call(undefined, err, data);
                });
              });
            }
          } else {
            data.deleted = true;
            data.save(function (err, data) {
              if (!err) {
                eventEmitter.emit("objectDeleted", id);
              }
              c.call(undefined, err, data);
            });
          }
        } else {
          c.call(undefined, "objectNotFound", null);
        }
      } else {
      }
    });
  },
  updateObject: async function (data, c, onErr) {
    var objects = (await db.appConnect()).model("object");
    var versions = (await db.appConnect()).model("objectVersion");
    const versionData = Object.assign({}, data.version, {
      author: data.user,
      type: data.type,
    });
    objects.findById(data.id, function (err, existingObject) {
      if (existingObject) {
        versions.create(versionData, function (err, newVersion) {
          if (newVersion) {
            existingObject.versions.unshift(newVersion._id);
            existingObject.save(function (err, data) {
              c.call(undefined, data);
            });
          } else {
          }
        });
      } else {
        if (onErr) {
          onErr.call(undefined, {
            type: { type: "objectDoesNotExists" },
            status: 404,
          });
        }
      }
    });
  },
  copyVersion: async function (versionID, project, c, onErr) {
    var versions = (await db.appConnect(project)).model("objectVersion");
    versions.findById(versionID, function (err, data) {
      if (data) {
        var cp = {
          key: data.key,
          object: data.object,
          project: data.project,
          location: data.location,
          author: data.author,
          type: data.type,
          meta: data.meta,
          name: data.name,
          action: data.action,
          size: 0,
        };
        if (c) {
          c.call(undefined, cp);
        }
      }
    });
  },
  renameObject: async function (req, author, c, onErr) {
    const name = req.body.name.trim().replace(/</g, "&lt;");
    const project = GetProject(req);
    const id = req.body.id;
    const objects = (await db.appConnect(project)).model("object");
    const versions = (await db.appConnect(project)).model("objectVersion");
    const scope = this;
    objects.findById(id, function (err, obj) {
      if (obj) {
        scope.copyVersion(obj.versions[0], project, function (versionData) {
          versionData.name = name;
          versionData.author = author;
          versionData.action = "rename";
          versionData.previousName = obj.name;
          versions.create(versionData, function (err, newVersion) {
            if (newVersion) {
              obj.versions.unshift(newVersion._id);
              obj.versionsLength = obj.versions.length;
              obj.name = name;
              obj.date = newVersion.date;
              obj.save(function (err, data) {
                if (data) {
                  eventEmitter.emit("objectRenamed", data);
                  c.call(undefined, data);
                }
              });
            }
          });
        });
      }
    });
  },
  createVersion: async function (versionData, odb, c) {
    var versions = odb.model("objectVersion");
    versions.create(versionData, function (err, newVersion) {
      if (newVersion) {
        eventEmitter.emit("versionCreated", newVersion);
        if (c) {
          c.call(undefined, newVersion);
        }
      }
    });
  },
  createObject: async function (data, c, onErr) {
    const odb = await db.appConnect(data.project);

    const objects = odb.model("object");
    const scope = this;
    const objectData = {
      name: data.name,
      mimeType: data.mimeType,
      type: data.type,
      subtype: data.subtype || null,
      versionsLength: 1,
      author: data.user,
      folder: data.folder || null,
      project: data.project,
      size: data.size,
    };

    const errs = [];

    if (!objectData.project) {
      errs.push(lang("Project is not defined"));
    }

    if (errs.length) {
      if (onErr) {
        onErr.call(undefined, {
          type: "missingValue",
          message: errs,
          status: 422,
        });
      }
      return;
    }

    const versionData = Object.assign(
      {},
      data.version,
      { name: data.name },
      { author: data.user, type: data.type },
      { mimeType: data.mimeType, size: data.size },
      { project: data.project }
    );

    objects.find(
      { name: data.name, folder: data.folder, project: data.project },
      function (err, existingObject) {
        if (!existingObject || !existingObject.length) {
          scope.createVersion(versionData, odb, function (newVersion) {
            objectData.versions = [newVersion._id];
            console.log(222, objectData);
            objects.create(objectData, function (err, newObect) {
              if (newObect) {
                newVersion.object = newObect._id;
                newVersion.save(function () {
                  eventEmitter.emit("objectCreated", newObect);
                  if (c) {
                    c.call(undefined, newObect);
                  }
                });
              }
            });
          });
        } else {
          if (onErr) {
            onErr.call(undefined, {
              type: { type: "objectExists" },
              status: 409,
            });
          }
        }
      }
    );
  },
  objectVersions: async function (id, projectid, c) {
    var objects = (await db.appConnect(projectid)).model("object");
    var versions = (await db.appConnect(projectid)).model("objectVersion");
    var usersModel = dbUsers.model("userRegister");
    objects.findById(id, function (err, data) {
      if (data) {
        versions
          .find({ _id: { $in: data.versions } })
          .populate("author", undefined, usersModel)
          .exec(function (err, dataVersions) {
            var sorted = dataVersions.sort(function (a, b) {
              return new Date(b.date) - new Date(a.date);
            });
            if (c && dataVersions) {
              c.call(undefined, sorted);
            }
          });
      }
    });
  },
  getSubFolders: async function (options) {
    let project = options.project;
    let folder = options.folder;
    let c = options.success;
    let errC = options.err;
    let user = options.user;

    const userID = user._id ? user._id : user;

    let scope = this;

    const objectsDb = await db.appConnect(project);

    let objects = objectsDb.model("object");
    let usersModel = dbUsers.model("userRegister");
    let sparams = {
      type: "folder",
    };
    if (folder === "_home_") {
      folder = null;
    }

    var groupsModel = dbUsers.model("accessGroup");

    const allGroups = await groupsModel.find().populate("users");
    const availableGroups = [];
    allGroups.forEach((node) => {
      if (ArrayContainsId(node.users, userID)) {
        availableGroups.push(node);
      }
    });

    sparams.folder = folder;
    sparams.project = project;
    sparams["$and"] = [
      {
        $or: [
          { $and: [{ users: { $size: 0 } }, { accessGroups: { $size: 0 } }] },
          { users: { $in: [userID] } },
          { author: userID },
          { accessGroups: { $in: availableGroups } },
        ],
      },
    ];

    objects
      .find(sparams)
      .populate("author", undefined, usersModel)
      .sort([["date", -1]])
      .lean()
      .exec(function (err, data) {
        if (data) {
          let arr = data.map(function (a) {
            return a._id;
          });
          objects
            .find({
              folder: { $in: arr },
              type: "folder",
              $and: sparams["$and"],
            })
            .lean()
            .exec(function (err, children) {
              let final = [...data];
              for (let ci = 0; ci < children.length; ci++) {
                let object = children[ci];
                for (let i = 0; i < final.length; i++) {
                  if (EqualIds(object.folder, final[i]._id)) {
                    final[i].hasChildren = true;
                  }
                }
              }
              c.call(undefined, final, children);
            });
        } else {
          if (errC) {
            errC.call(undefined, err);
          }
        }
      });
  },
  get: async function (params, c) {
    var scope = this;
    var skip = 0;
    var size = 40;

    var usersModel = dbUsers.model("userRegister");
    var groupsModel = dbUsers.model("accessGroup");

    const allGroups = await groupsModel.find().populate("users");
    const availableGroups = [];

    allGroups.forEach((node) => {
      if (ArrayContainsId(node.users, params.user)) {
        availableGroups.push(node);
      }
    });

    var sparams = {
      deleted: false,
    };

    if (params.trashed) {
      sparams.trashed = true;
    }

    if (params.project) {
      sparams.project = params.project;
    } else {
      c.call(undefined, {
        data: [],
        paging: null,
      });
      return;
    }
    var objects = (await db.appConnect(sparams.project)).model("object");
    if (params.folder) {
      sparams.folder = params.folder;
    }
    sparams["$or"] = [];
    if (params.find) {
      const toFind = params.find.replace(/\\|\//g, ""); // no slashes
      sparams["name"] = { $regex: new RegExp(toFind, "i") };
    } else {
      sparams.folder = sparams.folder || null;
    }

    var order = 1;
    var orderBy = "date";
    if (params.order_by) {
      orderBy = params.order_by;
    }
    if (orderBy === "version") {
      orderBy = "versionsLength";
    }
    if (params.order) {
      order = params.order === "asc" ? -1 : 1;
    }
    params.page = params.page || 1;
    skip = (params.page - 1) * size;

    if (!sparams["$or"].length) {
      delete sparams["$or"];
    }
    //  const groups = await groupsModel.find({users: })

    sparams["$and"] = [
      {
        $or: [
          { $and: [{ users: { $size: 0 } }, { accessGroups: { $size: 0 } }] },
          { author: params.user },
          { users: { $in: [params.user] } },
          // { "accessGroups.users._id": require('mongoose').mongo.ObjectId(params.user) }
          { accessGroups: { $in: availableGroups } },
        ],
      },
    ];

    if (params.modified) {
      const today = new Date();
      const todayRes = new Date();
      if (params.modified === "1") {
        // hour
        const hourago = new Date(today.getTime() - 1000 * 60 * 60);
        sparams.date = { $gte: hourago, $lt: todayRes };
      } else if (params.modified === "2") {
        // day
        const yesterday = new Date(today.getTime() - 1000 * 60 * 60 * 24);
        sparams.date = { $gte: yesterday, $lt: todayRes };
      } else if (params.modified === "3") {
        // week
        const previousweek = new Date(
          today.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        sparams.date = { $gte: previousweek, $lt: todayRes };
      } else if (params.modified === "4") {
        // month
        const previousMonth = new Date(today.setMonth(today.getMonth() - 1));
        sparams.date = { $gte: previousMonth, $lt: todayRes };
      } else if (params.modified === "5") {
        // year
        const previousMonth = new Date(
          today.setFullYear(today.getFullYear() - 1)
        );
        sparams.date = { $gte: previousMonth, $lt: todayRes };
      }
    }
    if (params.size) {
      const size = params.size.split("-");
      if (size.length === 3) {
        if (!params.type || params.type === "folder") {
          params.type = "file";
        }
        let sizeInequality = size[0].trim();
        sizeInequality = sizeInequality === "gt" ? "gt" : "lt";
        let sizeValue = Number(size[1]);
        const sizeUnit = size[2].trim();
        if (sizeInequality && sizeUnit && !isNaN(sizeValue)) {
          if (sizeUnit === "mb") {
            sizeValue *= 1048576;
          } else if (sizeUnit === "kb") {
            sizeValue *= 1024;
          }
          sparams.size = {};
          sparams.size["$" + sizeInequality] = sizeValue;
        }
      }
    }
    if (params.tags) {
      const tags = (params.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => !!tag);

      sparams.tags = { $in: tags };
    }
    if (params.type) {
      if (params.type === "file" || params.type === "folder") {
        sparams.type = params.type;
      } else {
        if (params.type === "image") {
          sparams.mimeType = { $regex: "image/", $options: "gi" };
        } else if (params.type === "document") {
          sparams.mimeType = {
            $regex: "application/msword|application/vnd|application/pdf",
            $options: "gi",
          };
        } else if (params.type === "media") {
          sparams.mimeType = { $regex: "audio/|video/", $options: "gi" };
        }
      }
    }

    objects.find(sparams).countDocuments(function (countErr, countData) {
      objects
        .find(sparams)
        .populate("author", undefined, usersModel)
        .populate("accessGroups", undefined, groupsModel)
        .sort([[orderBy, order]])
        .skip(skip)
        .limit(size)
        .exec(function (err, data) {
          c.call(undefined, {
            data: data,
            paging: scope.makePagingObject(countData, params.page, size),
          });
        });
    });
  },
  makePagingObject: function (total, page, objectsPerPage) {
    var final = {
      total: total,
      current: parseInt(page),
      pages: Math.ceil(total / objectsPerPage),
      perPage: objectsPerPage,
    };
    return final;
  },
  path: async function (id, projectId, c) {
    const data = await getParents(id, projectId);
    if (c) {
      c.call(undefined, user.preparePostData(data));
    }
    return data;
  },
  getObject: async (id, req, res, c, cerr) => {
    const objects = await db.getAppModel(req, "object");
    const versions = await db.getAppModel(req, "objectVersion");
    const usersModel = dbUsers.model("userRegister");
    return await objects
      .findById(id)
      .populate("author", undefined, usersModel)
      .populate({
        path: "versions",
        model: versions,
        populate: {
          path: "author",
          model: usersModel,
        },
      })
      .exec((err, data) => {
        eventEmitter.emit("objectPrview", err, data);
        if (err && cerr) {
          cerr.call(undefined, err);
        } else if (data && c) {
          c.call(undefined, data);
        }
      });
  },
};
