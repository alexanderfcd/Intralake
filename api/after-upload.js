const files = require("./files");
const db = require("./db");

var dbUsers = db.users();
var dbApp = db.app();
const eventEmitter = require("./events");
const afterUploadCreateObject = async (data, req, res) => {
  const cData = {
    version: {
      key: data.key || data.Key || null,
      location: data.location,
      etag: data.etag || null,
      mimeType: data.type,
      size: data.size,
    },
    name: data.name,
    user: data.user,
    type: "file",
    mimeType: data.type,
    folder: data.folder,
    project: data.project || GetProject(req),
    size: data.size,
  };

  if (data.resultConvert) {
    cData.version.ckey = data.dataConvert.data.key || data.dataConvert.data.Key;
    cData.version.ctag =
      data.dataConvert.data.etag || data.dataConvert.data.Etag;
    cData.version.clocation = data.dataConvert.data.Location;
    cData.version.ctype = data.dataConvert.data.mime;
    if (
      data.dataConvert.resultOriginal &&
      data.dataConvert.resultOriginal.data
    ) {
      cData.version.key = data.dataConvert.resultOriginal.data.Key;
    }
  }

  return new Promise((resolve) => {
    files.createObject(
      cData,
      function (object) {
        resolve({ error: false, data: object });
      },
      function (err) {
        resolve({ error: true, data: err });
      }
    );
  });
};
const afterUploadVersion = async (data, req, res) => {
  if (data.name === "undefined") {
    // data.name = undefined;
  }
  return new Promise(async (resolve) => {
    const odb = await db.appConnect(req);
    const objects = odb.model("object");
    objects.findById(req.query.objectId, async function (err, obj) {
      if (obj.type === "folder") {
        Respond({
          res: res,
          data: { message: "Folder cannot be uploaded" },
          status: 405,
        });
        return;
      }

      let action = "reupload";
      if (data.action === "edit") {
        action = data.action;
      }
      if (data.name === "undefined") {
        data.name = obj.name;
      }

      var cData = {
        version: {
          action: action,
          type: "file",
          key: data.key || null,
          location: data.location,
          etag: data.etag || null,
          mimeType: data.type,
          size: data.size,
        },
        name: data.name || obj.name,
        user: data.user,
        type: "file",
        mimeType: data.type,
      };

      if (data.resultConvert) {
        cData.version.ckey = data.dataConvert.data.Key;
        cData.version.ctag = data.dataConvert.data.ETag;
        cData.version.clocation = data.dataConvert.data.Location;
        cData.version.ctype = data.dataConvert.data.mime;
      }
      const versionData = Object.assign(
        { name: cData.name, object: obj._id, project: obj.project },
        cData.version,
        { author: cData.user, type: cData.type }
      );

      files.createVersion(
        versionData,
        odb,
        function (version) {
          if (version) {
            obj.versions.unshift(version._id);
            obj.versionsLength = obj.versions.length;
            obj.mimeType = cData.mimeType;
            obj.date = version.date;
            obj.size = version.size;
            obj.save(function (err, data) {
              eventEmitter.emit("newVersionUploaded", version, data);
              resolve({
                data: !err ? version : err,
                error: !!err,
              });
            });
          }
        },
        function (err) {
          resolve(null);
          Respond({
            res: res,
            data: err.type,
            status: err.status || 400,
          });
        }
      );
    });
  });
};
module.exports = async (data, type, req, res) => {
  // execute after last chunk
  const projectModel = dbUsers.model("project");
  const project = await projectModel.findById(GetProject(req)).exec();
  const size = Number(data.size);
  if (!project.totalSize) {
    project.totalSize = 0;
  }
  if (!project.totalFiles) {
    project.totalFiles = 0;
  }
  if (!project.totalVersions) {
    project.totalVersions = 0;
  }
  project.totalSize += size;
  if (!type || type === "createObject") {
    project.totalFiles += 1;
    await project.save();
    return afterUploadCreateObject(data, req, res);
  } else if (type === "modifyObject") {
    project.totalVersions += 1;
    await project.save();
    return afterUploadVersion(data, req, res);
  }
};
