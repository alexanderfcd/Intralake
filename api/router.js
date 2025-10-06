const ExpressBrute = require("express-brute");
const MongooseStore = require("express-brute-mongoose");
const BruteForceSchema = require("express-brute-mongoose/dist/schema");
const path = require("path");

const config = require("./config");

var moment = require("moment");
var db = require("./db");
const multer = require("multer");
var mongoose = db.mongoose();

var dbUsers = db.users();
var dbApp = db.app();

var userFunctions = require("./userFunctions");
var user = new userFunctions();
let schemas = require("./schemas");
schemas = new schemas();

const files = require("./files");
const afterUpload = require("./after-upload");

const multipartUpload = require("./multipart-upload");

const eventEmitter = require("./events");
const fs = require("fs");

var passport = require("passport");

const LocalStrategy = require("passport-local").Strategy;

const perms = require("./perms");

var lang = require("./lang");
const projectsAndRolse = require("./projectsandroles");

var upload = multer();

var uploadInternal = multer({
  limits: {
    fileSize: 1000000,
  },
});

var request = require("request");

const QBody = require("./qbody");
const { s3, S3Upload, S3CoreUpload } = require("./s3-upload");

const createId = function () {
  return Math.random().toString(36).substring(7) + new Date().getTime();
};

const createFileKey = function (name) {
  name = (name || "").trim();
  if (!name) return createId();
  const nameArray = name.split(".");
  return (
    nameArray[0] + createId() + (nameArray.length > 1 ? "." + nameArray[1] : "")
  );
};

const scope = "/app";
const scopeui = "/view";

const scopeuiPath = "/view";

var runModule = function (module, app) {
  app[module.method](module.path, function (req, res) {
    module.controller(req, res, app, scope);
  });
};

const extensionCheck = require("./ext");
const { email } = require("./emails.js");
const { lastRun } = require("gulp");

const needConvert = (name) => {
  const ext = name.split(".").pop();
  return extensionCheck.needConvert(ext);
};

const convert = async (name) => {
  return new Promise(async (resolve) => {
    const path = convertURL(name);
    const result = await S3UploadFromURL(path, name.split(".")[0] + ".pdf");
    resolve(result);
  });
};

async function S3UploadFromURL(url, key) {
  return new Promise(async (resolve) => {
    request(
      {
        url: url,
        encoding: null,
      },
      function (err, res, body) {
        if (err) {
          resolve({ err, res });
          return;
        }
        s3.putObject(
          {
            Key: key,
            Bucket: config.S3Bucket,
            /* ContentType: res.headers['content-type'],
                ContentLength: res.headers['content-length'],*/
            Body: body, // buffer
          },
          function (err, data) {
            if (data) {
              data.Key = key;
              data.Location = config.S3Config.getLocationByKey(key);
            }
            resolve({ err, data });
          }
        );
      }
    );
  });
}

module.exports = function (app) {
  var views = __dirname + "/views";
  var profile = __dirname + "/views/profile";

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async function (email, password, done) {
        var users = dbUsers.model("userRegister");
        users
          .findOne({
            email: email,
          })
          .select("+token +email +password")
          .exec(async function (err, data) {
            let result = null;

            if (data) {
              const isEqual = await config.encryptionCompare(
                password,
                data.password
              );
              if (isEqual) {
                data.token = appTools.tool.createPrivateToken();
                result = data.toObject();
                delete result.password;
                await data.save();
              }
            }
            return done(result);
          });
      }
    )
  );

  const uiIndex = [__dirname, "../vanilla/index.html"];

  const uiServe = (req, res) => {
    if (req.path.indexOf(".") === -1) {
      res.sendFile(path.join(...uiIndex));
    } else {
      res.sendFile(path.join(__dirname, "../vanilla", req.path));
    }
  };

  app.get(scopeui, async function (req, res) {
    uiServe(req, res);
  });

  app.get(scopeui + "/*", async function (req, res) {
    uiServe(req, res);
  });

  app.get(scope + "/ui-config", async function (req, res) {
    config;

    const data = {};

    Respond({
      status: 200,
      data,
      res: res,
    });
  });

  app.get("/status", async function (req, res) {
    Respond({
      status: 200,
      data: { node: "ok", db: mongoose.STATES[mongoose.connection.readyState] },
      res: res,
    });
  });

  app.post("/reqbody", function (req, res) {
    Respond({
      status: 200,
      data: req.body,
      res: res,
    });
  });

  app.get("/sys/reset-projects-roles", async function (req, res) {
    const users = dbUsers.model("userRegister");
    const roles = dbUsers.model("role");
    const projects = dbUsers.model("project");

    const allUsers = await users.find({}).exec();
    const allroles = await roles.find({}).exec();
    const allprojects = await projects.find({}).exec();
    allUsers.forEach(async (user) => {
      user.projects = [];
      user.roles = [];
      await user.save();
    });
    allroles.forEach(async (role) => {
      await role.remove();
    });
    allprojects.forEach(async (project) => {
      project.users = [];
      project.roles = [];
      await project.save();
    });
    Respond({
      status: 200,
      data: "Restored",
      res: res,
    });
  });

  app.get("/", function (req, res) {
    if (typeof config.rootAction === "function") {
      config.rootAction(req, res);
    } else {
      res.sendFile(__dirname + "/static/index.html");
    }
  });

  app.get(
    scope + "/preview-url/:obj_id/version/:v_id",
    async function (req, res) {
      if (
        !mongoose.Types.ObjectId.isValid(req.params.obj_id) ||
        !mongoose.Types.ObjectId.isValid(req.params.v_id)
      ) {
        Respond({
          status: 400,
          data: { code: "wrongId", ref: "hck" },
          res: res,
        });
        return;
      }

      const can = await perms.can(
        req,
        res,
        "previewObject",
        req.params.obj_id,
        GetProject(req)
      );
      if (!can.result) {
        Respond({
          status: 400,
          data: { code: "noPermissionToPreviewObject" },
          res: res,
        });
        return;
      }
      const isPreview = req.query.preview === "true";

      const versions = (await db.appConnect(req)).model("objectVersion");
      const objects = (await db.appConnect(req)).model("object");

      objects.findById(req.params.obj_id, function (err, objdata) {
        if (err) {
          Respond({
            status: 400,
            data: err,
            res: res,
          });
          return;
        }
        const __doPreview = (data) => {
          const key = isPreview ? data.ckey || data.key : data.key;
          const type = isPreview ? data.ctype || data.mimeType : data.mimeType;

          eventEmitter.emit("objectPreview", objdata, data);

          if (key) {
            var params = { Bucket: config.S3Bucket, Key: key };
            s3.getSignedUrlPromise("getObject", params, function (vx, url) {
              Respond({
                status: 200,
                data: { url, type },
                res,
              });
            });
          } else if (data.location) {
            const url =
              config.apiDomain +
              scope +
              "/object/" +
              req.params.obj_id +
              "/version/" +
              req.params.v_id +
              "?preview=" +
              (req.query.preview === "true") +
              "&token=" +
              appTools.tool.getToken(req) +
              "&project=" +
              GetProject(req);
            Respond({
              status: 200,
              data: { url, type },
              res,
            });
          } else {
            Respond({
              status: 200,
              data: { url: null, type },
              res,
            });
          }
        };
        versions
          .findById(req.params.v_id)
          .select("+location")
          .exec(function (err, data) {
            if (data) {
              __doPreview(data);
            } else {
              Respond({
                status: 400,
                data: err,
                res: res,
              });
            }
          });
      });
    }
  );
  app.get(scope + "/object/:obj_id/version/:v_id", async function (req, res) {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.obj_id) ||
      !mongoose.Types.ObjectId.isValid(req.params.v_id)
    ) {
      Respond({
        status: 400,
        data: { code: "wrongId", ref: "hck" },
        res: res,
      });
      return;
    }

    const can = await perms.can(
      req,
      res,
      "previewObject",
      req.params.obj_id,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        status: 400,
        data: { code: "noPermissionToPreviewObject" },
        res: res,
      });
      return;
    }
    const isPreview = req.query.preview === "true";

    const versions = (await db.appConnect(req)).model("objectVersion");
    const objects = (await db.appConnect(req)).model("object");

    objects.findById(req.params.obj_id, function (err, objdata) {
      if (err) {
        Respond({
          status: 400,
          data: err,
          res: res,
        });
        return;
      }
      const __doPreview = (data) => {
        const key = isPreview ? data.ckey || data.key : data.key;
        const type = isPreview ? data.ctype || data.mimeType : data.mimeType;

        let readStream;
        if (key) {
          var params = { Bucket: config.S3Bucket, Key: key };
          readStream = s3.getObject(params).createReadStream();
        } else if (data.location) {
          const loc = data.clocation || data.location;
          readStream = fs.createReadStream(
            __dirname + path.sep + config.serverUploadFolder + path.sep + loc
          );
        } else {
          Respond({
            res: res,
            // data: null,
            status: 200,
          });
          return;
        }

        res.setHeader("Content-Type", type);
        /*
                res.setHeader('Accept-Ranges', 'bytes' );
                res.setHeader('Content-Length', objdata.size );
                res.setHeader('Content-Range', `bytes 0-${objdata.size}`);

*/

        res.setHeader("Content-Range", `bytes 0-${objdata.size}`);
        if (req.query.download) {
          res.setHeader(
            "Content-disposition",
            "attachment; filename=" + objdata.name
          );
        }

        res.getHeaders();
        res.status(200);

        readStream.on("finish", (e) => {
          eventEmitter.emit("objectPreview", objdata, data);
        });
        readStream.on("close", function (a, b) {
          res.end();
        });
        readStream.pipe(res);
      };

      versions
        .findById(req.params.v_id)
        .select("+location")
        .exec(function (err, data) {
          if (data) {
            __doPreview(data);
          }
        });
    });
  });

  const graphql = require("graphql");
  const graphqlExpress = require("graphql-http/lib/use/express");
  const User = dbUsers.model("userRegister");
  const {
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLString,
    GraphQLList,
    buildSchema,
    GraphQLError,
  } = graphql;

  const userType = new GraphQLObjectType({
    name: "user",
    fields: () => ({
      id: { type: GraphQLString },
      name: { type: GraphQLString },
      firstName: { type: GraphQLString },
      lastName: { type: GraphQLString },
      password: { type: GraphQLString },
      email: { type: GraphQLString },
    }),
  });

  const userRootType = {
    user: {
      type: userType,
      args: {
        id: { type: GraphQLString },
      },
      resolve: async (parent, args) => {
        const data = await dbUsers
          .model("userRegister")
          .findById(args.id)
          .select("+email");
        if (data) {
          data.name = `${data.firstName} ${data.lastName}`;
        }
        return data;
      },
    },
  };

  const userMutation = {
    addUser: {
      type: userType,
      args: {
        firstName: { type: GraphQLString },
        email: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      resolve: async (parent, args) => {
        const existingUser = await dbUsers
          .model("userRegister")
          .findOne({ email: args.email });
        if (existingUser) {
          throw new GraphQLError("Email already exists", {
            extensions: { code: "EMAIL_CONFLICT", http: { status: 400 } },
          });
        }
        const arg = {
          email: args.email,
          firstName: args.firstName,
          password: await config.encryption(args.password),
        };

        const data = await dbUsers.model("userRegister").create(arg);

        return data;
      },
    },
  };

  const RootQuery = new GraphQLObjectType({
    name: "Query",
    fields: {
      ...userRootType,
    },
  });

  const RootMutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
      ...userMutation,
    },
  });

  const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation,
  });

  // ?query={hello}

  /*
            {
                user(id: "645d111cdb195e6fd006220f") {
                    id
                    name
                    email
                }
            }
        
        */

  /*
            {
                user(id: "645d111cdb195e6fd006220f") {
                    id
                    name
                    email
                }
            }
        
        */

  app.all(
    scope + "/graphql",
    graphqlExpress.createHandler({
      schema: schema,
    })
  );

  app.get(scope + "/user-public", function (req, res) {
    var scope = this;
    var id = req.query.user,
      users = dbUsers.model("userRegister");
    users.findOne({ id: id }, function (err, data) {
      if (data != null) {
        var final = {};
        final.id = data.id;
        final.name = data.name;
        final.meta = data.meta;
        Respond({
          status: 200,
          data: final,
          res: res,
        });
      } else {
        Respond({
          status: 403,
          data: { message: "Not found." },
          res: res,
        });
      }
    });
  });

  const bruteforcemodel = dbUsers.model(
    "bruteforce",
    new mongoose.Schema(BruteForceSchema)
  );
  const store = new MongooseStore(bruteforcemodel);

  const bruteforce = new ExpressBrute(store);

  app.post(scope + "/login", bruteforce.prevent, function (req, res) {
    user.login(req, res);
  });

  app.get(scope + "/billing", async function (req, res) {
    const token = appTools.tool.getToken(req);
    const can = await perms.can(req, res, "$isLogged");
    const users = dbUsers.model("userRegister");
    const payment = can.data.payment;
    const tokens = can.data.appTokens;
    const calc = 0;

    const pricePerGB = 0.22;
    const pricePerGBTransfer = 0.12;

    Respond({
      res: res,
      data: {
        payment,
        re: can.data,
        tokens,
      },
      status: 200,
    });
  });

  app.get(scope + "/user", async function (req, res) {
    const token = appTools.tool.getToken(req);
    const can = await perms.can(req, res, "$isLogged");
    var users = dbUsers.model("userRegister");
    var roles = dbUsers.model("role");
    var projectModel = dbUsers.model("project");

    // const result = can.data;
    const result = await users
      .findOne({ token: token })
      .select("+token +email +payment")
      .populate("roles", undefined, roles);

    const ownsProjects = await projectModel.find({
      $or: [{ owner: can.data._id }, { creator: can.data._id }],
    });
    const opIds = [];
    ownsProjects.forEach((prj) => {
      opIds.push("" + prj._id);
    });
    result.ownsProjects = ownsProjects;
    if (can.result) {
      Respond({
        res: res,
        data: { ...result._doc, ...{ ownsProjects: opIds } },
        status: 200,
      });
    }
  });

  app.post(scope + "/register", async function (req, res) {
    await user.register(req, res);
  });
  app.post(scope + "/rate", function (req, res) {
    user.rate(req, res);
  });

  app.get(scope + "/profile", function (req, res) {
    user.profile(req, res);
  });

  app.post(scope + "/update-profile", upload.any(), function (req, res) {
    user.updateprofile(req, res);
  });

  app.post(scope + "/resend-confirmation", function (req, res) {
    var token = appTools.tool.getToken(req),
      users = dbUsers.model("userRegister");
    users
      .findOne({ token: token })
      .select("+email")
      .exec(function (err, data) {
        user.sendConfirmationEmail(req, res, data);
      });
  });

  app.post(scope + "/reset-password", function (req, res) {
    user.sendResetLink(req, res);
  });

  app.get(scope + "/check-token", function (req, res) {
    user.checkToken(req, res);
  });
  app.get(scope + "/confirm", function (req, res) {
    user.confirm(req, res);
  });

  app.post(scope + "/restore-password", async function (req, res) {
    await user.restorePassword(req, res);
  });

  app.get(scope + "/comments/:id", function (req, res) {
    require("./comments").getCommentsByPostIdNew(req, res);
  });

  app.delete(scope + "/comment/:id", function (req, res) {
    require("./comments").editComment(req, res, true);
  });
  app.post(scope + "/comment", function (req, res) {
    require("./comments").postComment(req, res);
  });
  app.put(scope + "/comment", function (req, res) {
    require("./comments").editComment(req, res);
  });

  //modules

  app.delete(scope + "/trash/:id", async function (req, res) {
    if (!appTools.tool.isValidObjectId(req.params.id, res)) {
      return;
    }

    const can = await perms.can(
      req,
      res,
      "deleteObject",
      req.params.id,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: "noAccessForDeleteObject" },
        status: 400,
      });
      return;
    }
    var objects = (await db.appConnect(GetProject(req))).model("object");
    var scope = this;
    objects.findById(id, async function (err, data) {
      data.trashed = true;
      data.save(async function () {
        const odb = await db.appConnect(req);

        const versionData = {
          action: "trashed",
          name: data.name,
          type: data.subtype || data.type,
          author: can.data._id,
        };

        files.createVersion(versionData, odb, function (version) {
          Respond({
            res: res,
            data: { code: "objectTrashed" },
            status: 200,
          });
        });
      });
    });
  });
  app.delete(scope + "/object/:id", async function (req, res) {
    if (!appTools.tool.isValidObjectId(req.params.id, res)) {
      Respond({
        status: 404,
        data: { code: "notFound" },
        res: res,
      });
      return;
    }
    const can = await perms.can(
      req,
      res,
      "deleteObject",
      req.params.id,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: "noAccessForDeleteObject" },
        status: 400,
      });
      return;
    }
    try {
      require("./files").deleteObject(
        req.params.id,
        GetProject(req),
        async function (err, data) {
          const odb = await db.appConnect(req);

          const versionData = {
            action: "delete",
            name: data.name,
            type: data.subtype || data.type,
            author: can.data._id,
          };

          files.createVersion(versionData, odb, function (version) {
            Respond({
              res: res,
              data: { err: err, data: data },
              status: err ? 400 : 200,
            });
          });
        }
      );
    } catch (err) {
      Respond({
        res: res,
        data: "Error",
        status: 403,
      });
    }
  });

  app.post(scope + "/delete-objects", async (req, res) => {
    if (!GetProject(req)) {
      Respond({
        res: res,
        data: { message: "Project not specified" },
        status: 403,
      });
      return;
    }
    let ids = req.body.ids || req.body["ids[]"] || [];
    if (typeof ids === "string") {
      ids = ids.split(",").map((id) => {
        return id.trim();
      });
    }
    if (!ids.length) {
      Respond({
        res: res,
        data: { message: "ids not defined" },
        status: 403,
      });
      return;
    }
    try {
      const files = require("./files");
      const project = GetProject(req);
      let status = 200;
      let data = {};
      let rnames = [];
      let userId;
      for (const id of ids) {
        await new Promise(async (resolve) => {
          const can = await perms.can(req, res, "deleteObject", id, project);
          if (!userId) {
            userId = can.data._id;
          }
          if (!can.result) {
            status = 400;
            data.code = "noAccessForDeleteObject";
            resolve();
          } else {
            files.deleteObject(id, project, function (err, data) {
              if (err) {
                data = {};
                status = 400;
                data.error = err;
              } else {
                rnames.push(data.name);
              }
              resolve();
            });
          }
        });
      }
      if (status === 200) {
        const odb = await db.appConnect(req);

        const versionData = {
          action: "multiDelete",
          name: rnames.join(","),
          author: userId,
        };

        files.createVersion(versionData, odb, function (version) {
          Respond({
            res: res,
            data: data,
            status: status,
          });
        });
      } else {
        Respond({
          res: res,
          data: data,
          status: status,
        });
      }
    } catch (err) {}
  });

  const validName = async (req, res, respond) => {
    respond = typeof respond === "undefined" ? true : respond;
    const final = {
      res: res,
      status: 200,
    };
    return new Promise(async (resolve) => {
      const name = (req.body.name || req.query.name || "").trim();
      let folder = (req.body.folder || req.query.folder || "").trim();
      let project = (req.body.project || req.query.project || "").trim();
      if (!folder || folder === "undefined") {
        folder = null;
      }
      if (!name || !project) {
        final.data = false;
        if (respond) {
          Respond(final);
        }

        resolve(false);
        return;
      }
      const objects = (await db.appConnect(req)).model("object");

      objects.find(
        {
          name: name,
          folder: folder,
          project: project,
          deleted: false,
          trashed: false,
        },
        function (err, data) {
          if (err || data.length) {
            final.data = false;
            if (respond) {
              Respond(final);
            }
            resolve(false);
            return;
          }
          final.data = true;
          if (respond) {
            Respond(final);
          }
          resolve(true);
        }
      );
    });
  };

  app.post(scope + "/validname", (req, res) => {
    validName(req, res);
  });
  app.post(scope + "/validnames", async (req, res) => {
    // [name1, name2]
    var name = req.body.names || req.body["names[]"];
    var names = [];

    var folder = (req.body.folder || req.query.folder || "").trim();
    var project = (req.body.project || req.query.project || "").trim();
    if (!folder) {
      folder = null;
    }
    if (!name || !project) {
      Respond({
        res: res,
        data: {
          result: false,
          data: [],
        },
        status: 200,
      });
      return;
    }
    if (typeof name === "string") {
      name = name.split(",");
    }

    name.forEach(function (n) {
      names.push({
        name: n.trim(),
        folder: folder,
        project: project,
      });
    });
    var objects = (await db.appConnect(req)).model("object");
    objects.find({ $or: names }, function (err, data) {
      if (err || (data && data.length)) {
        var result = [];
        if (data && data.length) {
          data.forEach(function (item) {
            result.push(item.name);
          });
        }
        Respond({
          res: res,
          data: {
            result: false,
            data: result,
          },
          status: 200,
        });
        return;
      }
      Respond({
        res: res,
        data: {
          result: true,
        },
        status: 200,
      });
    });
  });
  app.post(scope + "/object", async function (req, res) {
    // for creating folders
    const qrec = QBody(req);
    if (!GetProject(req)) {
      Respond({
        res: res,
        data: { code: "Project not specified" },
        status: 403,
      });
      return;
    }
    const can = await perms.can(
      req,
      res,
      "createObject",
      qrec.body.folder,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: "noPermissionToCreateObject" },
        status: 400,
      });
    }

    const valid = await validName(req, res, false);

    if (!valid) {
      Respond({
        res: res,
        data: { code: "objectNameExists" },
        status: 403,
      });
      return;
    }

    var projectId = GetProject(qrec);

    if (!projectId) {
      Respond({
        res: res,
        data: { code: "projectNotSpecified" },
        status: 422,
      });
      return;
    }

    const user = can.data;
    var cData = {
      name: qrec.body.name.replace(/</g, "&lt;"),
      user: user,
      type: "folder",
      folder: qrec.body.folder,
      project: projectId,
    };

    var project = await dbUsers.model("project").findById(projectId).exec();

    if (qrec.body.subtype === "department") {
      cData.subtype = "department";
      cData.folder = null; // department is always in root
    }

    if (qrec.body.subtype === "document") {
      cData.subtype = "document";
      cData.type = "file";
      cData.mimeType = "text/html";

      project.totalFiles += 1;
    } else if (qrec.body.subtype === "spreadsheet") {
      cData.subtype = "spreadsheet";
      cData.type = "file";
      cData.mimeType = "application/json";
      project.totalFiles += 1;
    } else if (qrec.body.subtype === "bpmn") {
      cData.subtype = "bpmn";
      cData.type = "file";
      cData.mimeType = "application/xml";
      project.totalFiles += 1;
    } else {
      project.totalFolders += 1;
    }

    files.createObject(
      cData,
      function (object) {
        project.save(function () {
          Respond({
            res: res,
            data: object,
            status: 200,
          });
        });
      },
      function (err) {
        Respond({
          res: res,
          data: err.type,
          status: err.status || 400,
        });
      }
    );
  });

  app.post(scope + "/multipart-upload", upload.any(), multipartUpload);

  /*    app.post(scope + '/upload-object', upload.any(), async function(req, res) {

        const qb = QBody(req);
        const name = (qb.body.name || '').trim();
        const type = (qb.body.type || '').trim();
        const folder = (qb.body.folder || '').trim() || null;
        const project = GetProject(req);

        if(!project) {
            Respond({
                res: res,
                data: {'message': 'Project not specified'},
                status: 403
            });
            return;
        }


        if(!req.files || !req.files[0] || !req.files[0].buffer) {
            Respond({
                res: res,
                data: {'message': 'File not present '},
                status: 403
            });
            return;
        }

        const can = await perms.can(req, res, 'createObject', folder, project);
        if(!can.result){
            Respond({
                res: res,
                data: {code: 'noPermissionsToCreateObject'},
                status: 400
            });
            return;
        }
        const user = can.data;

        const objects = (await db.appConnect(req)).model('object');

        const exists = await objects.findOne({name: name, folder: folder, project: project}).exec();
        if (exists) {
            Respond({
                res: res,
                data: {code: 'objectNameExists'},
                status: 400
            });
            return;
        }

        // const nameID = path + name;
        const extarr = name.split('.');
        const ext2 = extarr.length > 1 ? ('.' + extarr.pop()) : '';
        const nameID = createId() + ext2;
        const up = await S3CoreUpload(req.files[0].buffer, nameID);

        if(!up.result) {
            Respond({
                res: res,
                data: {code: 'errorUploadFile', data: up.data},
                status: 403
            });
            return;
        }

        if (up.result) {
            const cData = {
                version: {
                    key: up.data.Key,
                    location: up.data.Location,
                    mi: up.data.Location,
                    etag: up.data.ETag,
                    mimeType: type,
                    size: req.files[0].size,
                },
                name: name,
                user: user,
                type: 'file',
                mimeType: type,
                folder:  folder,
                project:  project,
                size: req.files[0].size,
            };

            if (up.resultConvert) {
                cData.version.ckey = up.dataConvert.data.Key;
                cData.version.ctag = up.dataConvert.data.ETag;
                cData.version.clocation = up.dataConvert.data.Location;
                cData.version.ctype = 'application/pdf';
            }
            files.createObject(cData, function(object){
                Respond({
                    res: res,
                    data: object,
                    status: 200
                });
            }, function (err) {
                Respond({
                    res: res,
                    data: {type: err.type, message: err.message},
                    status: err.status || 400
                });
            });
        }
    });*/

  app.post(
    scope + "/upload-version/:objectId",
    upload.any(),
    async function (req, res) {
      const can = await perms.can(
        req,
        res,
        "modifyObject",
        req.params.objectId,
        req.body.project
      );
      if (!can || !can.result) {
        return;
      }
      const user = can.data;
      const odb = await db.appConnect(req);
      const objects = odb.model("object");
      objects.findById(req.params.objectId, async function (err, obj) {
        if (obj.type === "folder") {
          Respond({
            res: res,
            data: { message: "Folder cannot be uploaded" },
            status: 405,
          });
          return;
        }
        const extarray = obj.name.split(".");
        const ext1 = extarray.length > 1 ? "." + extarray.pop() : "";
        const nameID = createId() + ext1;
        const up = await S3CoreUpload(req.files[0].buffer, nameID);

        if (!up.result) {
          Respond({
            res: res,
            data: { code: "errorUploadFile", data: up.data },
            status: 403,
          });
          return;
        }

        if (up.result) {
          var cData = {
            version: {
              key: up.data.Key,
              location: up.data.Location,
              etag: up.data.ETag,
              action: "reupload",
              type: "file",
              mimeType: req.body.type,
              size: req.files[0].size,
            },
            name: req.body.name,
            user: user,
            type: "file",
            mimeType: req.body.type,
            folder: req.body.folder,
          };
          if (up.resultConvert) {
            cData.version.ckey = up.dataConvert.data.Key;
            cData.version.ctag = up.dataConvert.data.ETag;
            cData.version.clocation = up.dataConvert.data.Location;
            cData.version.ctype = up.dataConvert.data.mime;
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
                  Respond({
                    res: res,
                    data: version,
                    status: 200,
                  });
                });
              }
            },
            function (err) {
              Respond({
                res: res,
                data: err.type,
                status: err.status || 400,
              });
            }
          );
        }
      });
    }
  );

  app.get(scope + "/files", async function (req, res) {
    const can = await perms.can(req, res, "$accessProject", GetProject(req));
    if (!can.result) {
      return;
    }
    var params = {
      folder: req.query.folder || null,
      page: req.query.page || 1,
      order: req.query.order || "asc",
      order_by: req.query.order_by || "date",
      project: req.query.project,
    };

    if (req.query.folder === "favorites") {
      const modelrelation = dbApp.model("relation");

      const modelUser = dbUsers.model("userRegister");
      const objectModel = (await db.appConnect(GetProject(req))).model(
        "object"
      );

      let result = {
        data: [],
        paging: { total: 0, current: 1, pages: 0, perPage: 40 },
      };
      let curr = await modelrelation
        .findOne({
          author: can.data._id,
          project: GetProject(req),
          type: "favorites",
          subType: "favorites",
        })
        .populate("objects", undefined, objectModel);

      if (curr) {
        result.data = curr.objects;
        result.paging.perPage = curr.objects.length;
      }

      Respond({
        status: 200,
        data: result,
        res: res,
      });

      return;
    }

    if (req.query.trashed === "true" || req.query.folder === "trash") {
      params.trashed = true;
      delete params.folder;
    }

    if (params.folder) {
      const can = await perms.can(
        req,
        res,
        "previewObject",
        params.folder,
        GetProject(req)
      );
      if (!can.result) {
        Respond({
          status: 400,
          data: { code: "noPermissionToPreviewObject" },
          res: res,
        });
        return;
      }
    }
    if (!params.project) {
      Respond({
        status: 400,
        data: { message: lang("Project not specified") },
        res: res,
      });
      return;
    }
    if (req.query.find) {
      params.find = req.query.find;
    }

    if (req.query.tags) {
      params.tags = req.query.tags;
    }
    if (req.query.type) {
      params.type = req.query.type;
    }
    if (req.query.size) {
      params.size = req.query.size;
    }
    if (req.query.modified) {
      params.modified = req.query.modified;
    }
    if (req.query.tags) {
      params.modified = req.query.modified;
    }

    params.user = can.data._id;

    require("./files").get(params, function (data) {
      Respond({
        status: 200,
        data: data,
        res: res,
      });
    });
  });
  app.post(scope + "/rename", async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "modifyObject",
      req.body.id,
      GetProject(req)
    );
    if (!can.result) {
      return;
    }
    const user = can.data;
    require("./files").renameObject(req, user.id, function (data) {
      Respond({
        status: 200,
        data: data,
        res: res,
      });
    });
  });

  app.get(scope + "/object/:id", async function (req, res) {
    if (!appTools.tool.isValidObjectId(req.params.id, res)) {
      return;
    }

    const can = await perms.can(
      req,
      res,
      "previewObject",
      req.params.id,
      GetProject(req)
    );

    if (!can.result) {
      Respond({
        status: 404,
        data: { code: can.code },
        res: res,
      });
      return;
    }

    files.getObject(
      req.params.id,
      req,
      res,
      function (data) {
        Respond({
          status: 200,
          data: data,
          res: res,
        });
      },
      function (e, r) {
        Respond({
          status: 404,
          data: e,
          res: res,
        });
      }
    );
  });
  app.get(scope + "/object_versions", async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "previewObject",
      req.query.id,
      GetProject(req)
    );
    if (!can.result) {
      return;
    }
    require("./files").objectVersions(
      req.query.id,
      GetProject(req),
      function (data) {
        Respond({
          status: 200,
          data: data,
          res: res,
        });
      }
    );
  });
  /*app.get(scope + '/files/:what',function(req,res){
        files.get(req.params.what)
    });*/
  app.get(scope + "/tree", async function (req, res) {
    const can = await perms.can(req, res, "$accessProject", GetProject(req));
    if (!can.result) {
      return;
    }
    const success = function (data) {
      Respond({
        status: 200,
        data: data,
        res: res,
      });
    };
    const err = function (data) {
      Respond({
        status: 404,
        data: data,
        res: res,
      });
    };
    files.getSubFolders({
      project: GetProject(req),
      folder: null,
      success,
      err,
      user: can.data,
    });
  });

  app.get(scope + "/tree/:folder", async function (req, res) {
    const exceptionsIDs = ["starred", "trash", "_home_", null];

    let folder = (req.params.folder || "").trim();
    const projectId = GetProject(req);

    // todo: ui sends project id in "folder" parameter

    if (!folder || projectId === folder) {
      folder = null;
    }

    const isException = exceptionsIDs.indexOf(folder) !== -1;

    if (!isException && !mongoose.Types.ObjectId.isValid(folder)) {
      Respond({
        status: 400,
        data: { code: "wrongId", ref: "hck" },
        res: res,
      });
      return;
    }

    let can;
    if (isException) {
      can = await perms.can(req, res, "$accessProject", projectId);

      folder = null;
    } else {
      can = await perms.can(req, res, "previewObject", folder, projectId);
    }

    if (!can.result) {
      return;
    }
    files.getSubFolders({
      project: GetProject(req),
      folder,
      success: function (data, sub) {
        Respond({
          status: 200,
          data: [...data],
          res: res,
        });
      },
      user: can.data,
    });
  });
  app.get(scope + "/path", async function (req, res) {
    const project = GetProject(req);
    const roles = dbUsers.model("role");

    const can = await perms.can(req, res, "$accessProject", project);
    if (!can.result) {
      Respond({
        status: 400,
        data: { code: can.code },
        res: res,
      });
      return;
    }
    Respond({
      status: 200,
      data: [],
      res: res,
    });
  });
  app.get(scope + "/path/:id", async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "previewObject",
      req.params.id,
      GetProject(req)
    );

    if (!can.result) {
      Respond({
        status: 400,
        data: { code: can.code },
        res: res,
      });
      return;
    }

    if (req.params.id === "_home_") {
      Respond({
        status: 200,
        data: [],
        res: res,
      });
      return;
    } else if (!appTools.tool.isValidObjectId(req.params.id, res)) {
      return;
    }

    files.path(req.params.id, GetProject(req), function (data) {
      Respond({
        status: 200,
        data: data,
        res: res,
      });
    });
  });

  app.post(scope + "/tags", async function (req, res) {
    if (!req.body.id) {
      Respond({
        status: 403,
        data: { message: "Id not specified" },
        res: res,
      });
      return;
    }
    const can = await perms.can(
      req,
      res,
      "modifyObject",
      req.body.id,
      GetProject(req)
    );
    if (!can.result) {
      return;
    }
    var objects = (await db.appConnect(req)).model("object");
    objects.findById(req.body.id, function (err, data) {
      if (data) {
        let tags = req.body.tags || req.body["tags[]"] || "";
        tags = (Array.isArray(tags) ? tags : tags.split(","))
          .map((tag) => tag.trim())
          .filter((tag) => !!tag);
        data.tags = tags;

        data.save(function (err, sdata) {
          if (sdata) {
            Respond({
              status: 200,
              data: "tagsUpdated",
              res: res,
            });
          } else {
            Respond({
              status: 400,
              data: err,
              res: res,
            });
          }
        });
      }
    });
  });

  app.post(scope + "/public/:id/:value", async function (req, res) {
    if (!appTools.tool.isValidObjectId(req.params.id, res)) {
      return;
    }
    const can = await perms.can(
      req,
      res,
      "modifyObject",
      req.params.id,
      GetProject(req)
    );
    if (!can.result) {
      return;
    }
    const objects = (await db.appConnect(req)).model("object");
    objects.findById(req.params.id, function (err, data) {
      if (noError(err, res)) {
        data.public = (req.params.value || "") === "true";
        data.save(function (err) {
          if (noError(err, res)) {
            Respond({
              status: 200,
              data: { message: "changes saved" },
              res: res,
            });
          }
        });
      }
    });
  });

  app.get(scope + "/stars/:project", async function (req, res) {
    const can = await perms.can(req, res, "$accessProject", req.params.project);
    if (!can.result) {
      Respond({
        status: 400,
        data: { code: "noPermissions" },
        res: res,
      });
      return;
    }

    const model = dbApp.model("relation");

    let result = [];
    let curr = await model.findOne({
      author: can.data._id,
      project: GetProject(req),
      type: "favorites",
      subType: "favorites",
    });

    if (curr) {
      result = curr.objects;
    }

    Respond({
      status: 200,
      data: result,
      res: res,
    });
  });

  app.post(scope + "/star/:id/:value", async function (req, res) {
    // todo: maybe split the favorite items in different documents for pagination purposes

    if (!appTools.tool.isValidObjectId(req.params.id, res)) {
      Respond({
        status: 404,
        data: { code: "objectNotFound" },
        res: res,
      });
      return;
    }
    if (!GetProject(req)) {
      Respond({
        status: 404,
        data: { code: "projectNotFound" },
        res: res,
      });
      return;
    }

    const can = await perms.can(req, res, "$accessProject", GetProject(req));
    if (!can.result) {
      Respond({
        status: 400,
        data: { code: "noPermissions" },
        res: res,
      });
      return;
    }

    const what = await dbApp.model("object").findOne({
      _id: req.params.id,
      project: GetProject(req),
    });

    if (what) {
      Respond({
        status: 404,
        data: { code: "objectNotFound" },
        res: res,
      });
      return;
    }
    const val = req.params.value === "true";

    const model = dbApp.model("relation");
    let curr = await model.findOne({
      author: can.data._id,
      project: GetProject(req),
      type: "favorites",
      subType: "favorites",
    });

    if (!curr) {
      curr = await model.create({
        author: can.data._id,
        project: GetProject(req),
        type: "favorites",
        subType: "favorites",
      });
    }

    const theId = mongoose.Types.ObjectId(req.params.id);
    const theIndex = curr.objects.indexOf(theId);

    let result = false;

    if (theIndex !== -1) {
      if (!val) {
        const copy = [...curr.objects];
        copy.splice(theIndex, 1);
        curr.objects = copy;
        curr.markModified("objects");
        result = true;
      }
    } else {
      if (val) {
        curr.objects.unshift(req.params.id);
        curr.markModified("objects");
        result = true;
      }
    }

    if (result) {
      await curr.save();
    }

    Respond({
      status: 200,
      data: result,
      res: res,
    });
  });
  app.post(scope + "/star-old/:id/:value", async function (req, res) {
    if (!appTools.tool.isValidObjectId(req.params.id, res)) {
      return;
    }
    const prj = GetProject(req);
    const subType = prj ? "starredProjectObjects" : "starredObjects";

    const can = await perms.can(
      req,
      res,
      "previewObject",
      req.params.id,
      prj,
      "+" + subType
    );
    if (!can.result) {
      Respond({
        status: 400,
        data: { code: "noPermissions" },
        res: res,
      });
      return;
    }
    const user = can.data;

    let changed = false;
    let projectStarsForUser;

    if (req.params.value === "true" || req.params.value === "false") {
      if (subType === "starredProjectObjects") {
        let obj = user.starredProjectObjects.find((itm) =>
          EqualIds(itm.project, prj)
        );
        if (!obj) {
          obj = {
            project: prj,
            objects: [],
          };
          user.starredProjectObjects.push(obj);
        }

        const indexOf = obj.objects.indexOf(req.params.id);

        if (req.params.value === "true") {
          if (indexOf === -1) {
            changed = true;
            obj.objects.push(req.params.id);
          }
        } else if (req.params.value === "false") {
          if (indexOf !== -1) {
            changed = true;
            obj.objects.splice(indexOf, 1);
          }
        }
      } else if (subType === "starredObjects") {
        if (req.params.value === "true") {
          if (user.starredObjects.indexOf(id) === -1) {
            user.starredObjects.unshift(req.params.id);
            changed = true;
          }
        } else if (req.params.value === "false") {
          if (user.starredObjects.indexOf(id) !== -1) {
            user.starredObjects.splice(req.params.id);
            changed = true;
          }
        }
      }
    }

    if (!changed) {
      Respond({
        status: 200,
        data: { code: "notChanged" },
        res: res,
      });
      return;
    }
    user.save(function (err, data) {
      if (err) {
        Respond({
          status: 400,
          data: err,
          res: res,
        });
      } else {
        Respond({
          status: 200,
          data: data,
          res: res,
        });
      }
    });
  });

  app.get(scope + "/projects", async function (req, res) {
    projectsAndRolse.getProjects(req, res);
  });

  app.get(scope + "/project/:id", async function (req, res) {
    projectsAndRolse.projectId(req, res);
  });

  app.post(scope + "/project", async function (req, res) {
    projectsAndRolse.createProject(req, res);
  });

  var saveFile = async (file) => {
    return new Promise(async (resolve) => {
      const name = createId();
      const path =
        __dirname + appSeparator + config.staticPath + appSeparator + name;
      require("fs").writeFile(path, file, async function (err) {
        resolve(name);
      });
    });
  };

  //update exsting project
  app.post(
    scope + "/project/:id",
    uploadInternal.any(),
    async function (req, res) {
      if (!appTools.tool.isValidObjectId(req.params.id, res)) {
        return;
      }
      const can = await perms.can(req, res, "$manageProject", req.params.id);
      if (can.result) {
      }

      const qb = QBody(req);

      const file = req.files[0];

      if (!!file) {
        const accept = "image/png,image/x-png,image/gif,image/jpeg,image/webp";
        if (accept.indexOf(file.mimetype.toLowerCase()) !== -1) {
          qb.body.image = await saveFile(file.buffer);
        }
      }

      /*  const name = (qb.body.name || '').trim();
            const type = (qb.body.type || '').trim();
            const folder = (qb.body.folder || '').trim() || null;
            const project = GetProject(req);*/

      projectsAndRolse.updateProject(req, res, qb);
    }
  );

  app.post(scope + "/role", async function (req, res) {
    projectsAndRolse.createRole(req, res);
  });

  app.get(scope + "/role/:id", async function (req, res) {
    if (!appTools.tool.isValidObjectId(req.params.id, res)) {
      return;
    }
    const can = await perms.can(
      req,
      res,
      "modifyRole",
      req.params.id,
      GetProject(req)
    );
    if (can.result) {
      const roles = dbUsers.model("role");
      const usersModel = dbUsers.model("userRegister");
      const tempInvitation = dbUsers.model("tempInvitation");
      roles
        .findById(req.params.id)
        .populate("users", undefined, usersModel)
        .populate("invitations", undefined, tempInvitation)
        .exec(function (err, data) {
          if (err) {
            Respond({
              status: 400,
              data: err,
              res: res,
            });
          } else {
            Respond({
              status: 200,
              data: data,
              res: res,
            });
          }
        });
    }
  });

  app.post(scope + "/delete-role/:id", async function (req, res) {
    if (!appTools.tool.isValidObjectId(req.params.id, res)) {
      return;
    }
    const can = await perms.can(
      req,
      res,
      "deleteRole",
      req.params.id,
      GetProject(req)
    );
    if (can.result) {
      const roles = dbUsers.model("role");
      roles.findById(req.params.id, function (err, data) {
        if (err) {
          Respond({
            status: 400,
            data: err,
            res: res,
          });
        } else {
          if (data.users.length === 0 && data.invitations.length === 0) {
            data.remove(function () {
              Respond({
                status: 200,
                data: { code: "roleDeleted" },
                res: res,
              });
            });
          } else {
            Respond({
              status: 400,
              data: { code: "roleDataNotEmpty" },
              res: res,
            });
          }
        }
      });
    }
  });

  app.post(scope + "/role/:id", async function (req, res) {
    if (!appTools.tool.isValidObjectId(req.params.id, res)) {
      return;
    }
    const name = (req.body.name || "").trim();
    const project = GetProject(req);
    if (!project) {
      Respond({
        status: 403,
        data: { message: lang("Project not specified") },
        res: res,
      });
    }
    const can = await perms.can(req, res, "modifyRole", req.params.id, project);
    if (can.result) {
      const userRegister = dbUsers.model("userRegister");
      const roles = dbUsers.model("role");
      roles.findById(req.params.id, async function (err, data) {
        if (err) {
          Respond({
            status: 403,
            data: err,
            res: res,
          });
        } else {
          data.name = req.body.name;
          var can = {};
          for (let key in schemas.rolePermissionFields) {
            can[key] = req.body[key] ? req.body[key] === "true" : data.can[key];
          }
          data.can = can;
          if (req.body["users"]) {
            data.users = eq.body["users"];
          }
          await userRegister.update(
            { _id: { $in: data.users } },
            { $addToSet: { roles: data._id } },
            { multi: true }
          );
          data.save(function (err, data) {
            if (err) {
              Respond({
                status: 400,
                data: err,
                res: res,
              });
            } else {
              Respond({
                status: 200,
                data: data,
                res: res,
              });
            }
          });
        }
      });
    }
  });

  app.post(scope + "/role-add-user/:role_id", async function (req, res) {
    projectsAndRolse.addUserToRole(req, res);
  });
  app.post(scope + "/role-remove-user/:role_id", async function (req, res) {
    projectsAndRolse.removeUserFromRole(req, res);
  });

  app.post(scope + "/move", async function (req, res) {
    const b = req.body;
    if (!b.what || !b.fromproject) {
      Respond({
        status: 403,
        data: "Missing entity",
        res: res,
      });
    }
    b.to = b.to || null;

    const connection = await db.appConnect(req);
    const objects = connection.model("object");
    const pm = dbUsers.model("project");
    const what = await objects
      .findOne({
        _id: b.what,
        project: b.fromproject,
      })
      .exec();

    let nameExists = what.name;
    if (b.field) {
      if (b.field === "rename") {
        nameExists = b.fieldMore || nameExists;
      }
    }
    const exists = await objects
      .findOne({ name: nameExists, folder: b.to })
      .exec();

    if (!b.field || b.field !== "overwrite") {
      if (exists) {
        Respond({
          status: 403,
          data: {
            code: "objectExists",
            showMessage: false,
            data: {
              what: b.what,
              fromproject: b.fromproject,
              to: b.to,
              name: nameExists,
            },
          },
          res: res,
        });
        return;
      }
    }

    const canSource = await perms.can(
      req,
      res,
      "modifyObject",
      b.what,
      b.fromproject
    );

    if (!canSource.result) {
      Respond({
        status: 403,
        data: {
          code: "noPermissionsToModifyObject",
        },
        res: res,
      });
      return;
    }

    const can = await perms.can(req, res, "modifyObject", b.to, b.fromproject);
    if (!can.result) {
      Respond({
        status: 403,
        data: {
          code: "noPermissionsToModifyObject",
        },
        res: res,
      });
      return;
    }

    const cloneConfig = {
      item: what,
      target: b.to,
      author: can.data._id,
      connection: connection,
    };

    if (nameExists) {
      cloneConfig.name = nameExists;
    }

    if (b.field && b.field === "overwrite" && exists) {
      files.deleteObject(exists._id, async function () {
        const clone = await files.doMove(cloneConfig);
        Respond({
          status: 200,
          data: clone,
          res: res,
        });
      });
    } else {
      const clone = await files.doMove(cloneConfig);
      Respond({
        status: 200,
        data: clone,
        res: res,
      });
    }
  });
  app.post(scope + "/copy", async function (req, res) {
    const b = req.body;
    if (!b.what || !b.fromproject) {
      Respond({
        status: 403,
        data: "Missing entity",
        res: res,
      });
    }
    b.to = b.to || null;

    const connections = await db.appConnect(req);

    const objects = connections.model("object");
    const versions = connections.model("objectVersion");
    const pm = dbUsers.model("project");
    const what = await objects
      .findOne({
        _id: b.what,
        project: b.fromproject,
      })
      .populate("versions", undefined, versions)
      .exec();

    let nameExists = what.name;
    if (b.field) {
      if (b.field === "rename") {
        nameExists = b.fieldMore || nameExists;
      }
    }
    const exists = await objects
      .findOne({ name: nameExists, folder: b.to })
      .exec();

    if (!b.field || b.field !== "overwrite") {
      if (exists) {
        Respond({
          status: 403,
          data: {
            code: "objectExists",
            showMessage: false,
            data: {
              what: b.what,
              fromproject: b.fromproject,
              to: b.to,
              name: nameExists,
            },
          },
          res: res,
        });
        return;
      }
    }

    const can = await perms.can(req, res, "modifyObject", b.to, b.fromproject);
    if (!can.result) {
      Respond({
        status: 403,
        data: {
          code: "noPermissionsToModifyObject",
        },
        res: res,
      });
      return;
    }

    const cloneConfig = {
      item: what,
      target: b.to,
      author: can.data._id,
      connection: connections,
    };

    if (nameExists) {
      cloneConfig.name = nameExists;
    }

    if (b.field && b.field === "overwrite" && exists) {
      files.deleteObject(exists._id, async function () {
        const clone = await files.doClone(cloneConfig);
        Respond({
          status: 200,
          data: clone,
          res: res,
        });
      });
    } else {
      const clone = await files.doClone(cloneConfig);
      Respond({
        status: 200,
        data: clone,
        res: res,
      });
    }
  });

  app.post(
    scope + "/object-access-data/object/:object/project/:project",
    async function (req, res) {
      const project = GetProject(req);
      if (!project || !req.params.object) {
        Respond({
          status: 403,
          data: { message: "Missing entity" },
          res: res,
        });
        return;
      }
      const can = await perms.can(
        req,
        res,
        "modifyObject",
        req.params.object,
        project
      );
      if (!can.result) {
        Respond({
          status: 403,
          data: { code: "noPermissionsToModifyObject" },
          res: res,
        });
        return;
      }
      const obj = await (await db.appConnect(req))
        .model("object")
        .findById(req.params.object)
        .exec();

      if (!obj) {
        Respond({
          status: 400,
          data: { code: "objectNotFound" },
          res: res,
        });
        return;
      }

      const objectSupportsAccessModification = async (obj) => {
        return new Promise(async (resolve) => {
          if (obj.subtype !== "department" && obj.type !== "file") {
            resolve(false);
            return;
          }

          if (obj.users && obj.users.length) {
            resolve(false);
            return;
          }
          if (obj.accessGroups && obj.accessGroups.length) {
            resolve(false);
            return;
          }

          if (!obj.folder) {
            resolve(true);
            return;
          }

          resolve(
            await objectSupportsAccessModification(
              await (await db.appConnect(req))
                .model("object")
                .findById(obj.folder)
                .exec()
            )
          );
        });
      };

      const canModifyAccess =
        !obj.folder ||
        (await objectSupportsAccessModification(
          await (await db.appConnect(req))
            .model("object")
            .findById(obj.folder)
            .exec()
        ));

      if (!canModifyAccess) {
        Respond({
          status: 400,
          data: { code: "cantModifyAccess" },
          res: res,
        });
        return;
      }

      const users = req.body.users || "";

      if (req.body.type === "all") {
        obj.users = [];
        obj.accessGroups = [];
        await obj.save();
      } else if (req.body.type === "custom") {
        let users = (req.body.users || "").trim();
        users = users ? users.split(",") : [];
        let accessGroups = (req.body.accessGroups || "").trim();
        accessGroups = accessGroups ? accessGroups.split(",") : [];
        users.forEach((part, i, arr) => {
          arr[i] = arr[i].trim();
        });
        accessGroups.forEach(function (part, i, arr) {
          arr[i] = arr[i].trim();
        });
        obj.users = users;

        obj.accessGroups = accessGroups;

        await obj.save();
      }

      Respond({
        status: 200,
        data: { code: "Object Updated" },
        res: res,
      });
    }
  );
  app.get(scope + "/project-data", async function (req, res) {
    const project = GetProject(req);
    const usersModel = dbUsers.model("userRegister");
    const dbv = await db.appConnect(req);
    const pluginsModel = dbv.model("plugin");
    const pm = await dbUsers
      .model("project")
      .findById(project)
      .populate("users", undefined, usersModel)
      .populate("plugins", undefined, pluginsModel)
      .exec();
    Respond({
      status: 200,
      data: pm,
      res: res,
    });
  });

  app.post(scope + "/delete-project/:project", async function (req, res) {
    //todo: test
    const prj = GetProject(req);
    const can = await perms.can(req, res, "$manageProject", prj);
    const dbv = await db.appConnect(req);
    const objects = dbv.model("object");
    const projectModel = dbUsers.model("project");
    const usersModel = dbUsers.model("userRegister");
    if (!can.result) {
      Respond({
        status: 400,
        data: {
          code: "noPermissions",
        },
        res: res,
      });
      return;
    }

    const numberOfObjects = await objects.count({ project: prj }).exec();

    if (numberOfObjects !== 0) {
      Respond({
        status: 400,
        data: { code: "projectNotEmpty" },
        res: res,
      });
      return;
    }

    const projectDoc = await projectModel.findById(prj).exec();

    const roles = projectDoc.roles;
    const rolesModel = dbUsers.model("role");

    for (let i = 0; i < roles.length; i++) {
      const role = await rolesModel.findById(roles[i]).exec();
      if (!role) {
        continue;
      }
      for (let u of role.users) {
        const user = await usersModel.findById(role.users[u]).exec();

        if (user.roles && user.roles.length) {
          var ur = user.roles.indexOf(roles[i]);

          if (ur > -1) {
            user.roles.splice(ur, 1);
          }
        }

        if (user.projects) {
          var up = user.projects.indexOf(roles[i]);
          if (up > -1) {
            user.projects.splice(up, 1);
          }
        }
        await user.save();
      }

      await role.remove();
    }

    await projectDoc.remove();

    Respond({
      status: 200,
      data: projectDoc,
      res: res,
    });
  });
  app.get(scope + "/project-data/:project", async function (req, res) {
    const project = GetProject(req);
    const roles = dbUsers.model("role");

    const can = await perms.can(req, res, "$accessProject", project);

    if (!can.result) {
      Respond({
        status: 400,
        data: { code: "noPermissions" },
        res: res,
      });
      return;
    }

    const dbv = await db.appConnect(req);

    const objects = dbv.model("object");

    const pluginsModel = dbv.model("plugin");
    const usersModel = dbUsers.model("userRegister");
    const pm = await dbUsers
      .model("project")
      .findById(project)
      .populate("owner", undefined, usersModel)
      .populate("users", undefined, usersModel)
      .populate("roles", undefined, roles)
      /*            .populate('plugins', undefined, pluginsModel)
            .populate('plugins.addedBy', undefined, usersModel)*/
      .populate({
        path: "plugins",
        model: pluginsModel,
        populate: {
          path: "addedBy",
          model: usersModel,
        },
      })
      .exec();
    const obj = pm.toObject();
    if (!obj.users) {
      obj.users = [];
    }
    obj.users.push(obj.owner);
    obj.numberOfObjects = await objects.count({ project: project }).exec();
    obj.isEmpty = obj.numberOfObjects === 0;
    Respond({
      status: 200,
      data: obj,
      res: res,
    });
  });

  app.get(
    scope + "/object-access-data/object/:object/project/:project",
    async function (req, res) {
      const project = GetProject(req);
      if (!project || !req.params.object) {
        Respond({
          status: 403,
          data: { message: "Missing entity" },
          res: res,
        });
        return;
      }
      const can = await perms.can(
        req,
        res,
        "modifyObject",
        req.params.object,
        project
      );
      if (!can.result) {
        Respond({
          status: 403,
          data: { code: "noPermissionsToModifyObject" },
          res: res,
        });
        return;
      }
      const usersModel = dbUsers.model("userRegister");
      const accessGroup = dbUsers.model("accessGroup");
      const data = {};
      const pm = await dbUsers
        .model("project")
        .findById(project)
        .populate("users", undefined, usersModel)
        .exec();
      const obj = await (
        await db.appConnect(req)
      )
        .model("object")
        .findById(
          req.params.object
        ) /*.populate('users', undefined, usersModel).populate('accessGroups', undefined, accessGroup)*/
        .exec();
      const objAccessGroup = await accessGroup
        .find({ project: project })
        .exec();
      data.project = pm;
      data.objectUsers = obj.users || [];
      data.objectAccessGroups = obj.accessGroups || [];
      data.accessGroups = objAccessGroup || [];

      Respond({
        status: 200,
        data: data,
        res: res,
      });
    }
  );
  app.get(scope + "/roles/:project", async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "modifyRole",
      undefined,
      GetProject(req)
    );
    if (can.result) {
      const roles = dbUsers.model("role");
      const usersModel = dbUsers.model("userRegister");
      roles
        .find({
          $or: [
            { users: { $in: [can.data._id] } },
            { owner: can.data._id },
            { creator: can.data._id },
          ],
          project: GetProject(req),
        })
        .populate("owner", undefined, usersModel)
        .sort([["date", -1]])
        .exec(function (err, data) {
          if (err) {
            Respond({
              status: 400,
              data: { message: err },
              res: res,
            });
          } else {
            Respond({
              status: 200,
              data: data,
              res: res,
            });
          }
        });
    }
  });

  app.post(scope + "/create-access-group", async function (req, res) {
    const name = req.body.name.trim();
    let users = (req.body.users || "").trim().split(",");
    users = !!users ? users : [];
    users = users.filter((usr) => !!usr);
    const can = await perms.can(
      req,
      res,
      "modifyRole",
      undefined,
      GetProject(req)
    );
    if (can.result) {
      const project = GetProject(req);
      const accessGroup = dbUsers.model("accessGroup");
      const projectModel = dbUsers.model("project");
      const projectData = await projectModel.findById(project);
      const conf = {
        name: name,
        creator: can.data.id,
        meta: String,
        project: GetProject(req),
        users: users,
      };
      if (!conf.name || !conf.creator || !conf.project) {
        Respond({
          status: 403,
          data: { code: "missingEntity" },
          res: res,
        });
        return;
      }
      accessGroup.create(conf, function (err, newGroup) {
        eventEmitter.emit("accessGroupCreated", newGroup);
        Respond({
          status: 200,
          data: newGroup,
          res: res,
        });
      });
    }
  });

  app.get(scope + "/access-group/:group", async function (req, res) {
    const project = GetProject(req);
    const can = await perms.can(
      req,
      res,
      "modifyRole",
      undefined,
      GetProject(req)
    );
    if (can.result) {
      const project = GetProject(req);
      const accessGroup = dbUsers.model("accessGroup");
      const usersModel = dbUsers.model("userRegister");
      const group = await accessGroup
        .findById(req.params.group)
        .populate("users", undefined, usersModel);
      Respond({
        status: 200,
        data: group,
        res: res,
      });
    }
  });
  app.post(scope + "/delete-access-group/:group", async function (req, res) {
    const project = GetProject(req);
    const can = await perms.can(
      req,
      res,
      "modifyRole",
      undefined,
      GetProject(req)
    );
    if (can.result) {
      const project = GetProject(req);
      const accessGroup = dbUsers.model("accessGroup");
      accessGroup.findByIdAndRemove(req.params.group, function (err, data) {
        if (err) {
          Respond({
            status: 400,
            data: err,
            res: res,
          });
        } else {
          Respond({
            status: 200,
            data: data,
            res: res,
          });
        }
      });
    }
  });
  app.post(scope + "/access-group/:group", async function (req, res) {
    const name = (req.body.name || "").trim();
    if (!name) {
      Respond({
        status: 403,
        data: { code: "missingEntity", path: "name" },
        res: res,
      });
      return;
    }
    const project = GetProject(req);

    const can = await perms.can(
      req,
      res,
      "modifyRole",
      undefined,
      GetProject(req)
    );
    if (can.result) {
      const project = GetProject(req);
      const accessGroup = dbUsers.model("accessGroup");
      accessGroup.findById(req.params.group, function (err, g) {
        if (g) {
          g.name = name;
          g.users = (req.body.users || "")
            .trim()
            .split(",")
            .filter((a) => !!a.trim());
          g.save(function (err, data) {
            if (err) {
              Respond({
                status: 400,
                data: err,
                res: res,
              });
            } else {
              Respond({
                status: 200,
                data: data,
                res: res,
              });
            }
          });
        } else {
          Respond({
            status: 400,
            data: err,
            res: res,
          });
        }
      });
    }
  });

  app.get(scope + "/access-groups/:project", async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "modifyRole",
      undefined,
      GetProject(req)
    );
    if (can.result) {
      const accessGroup = dbUsers.model("accessGroup");
      const usersModel = dbUsers.model("userRegister");
      accessGroup
        .find({
          /*$or: [
                        {users: { "$in": [can.data._id]}},
                        {owner: can.data._id},
                        {creator: can.data._id},
                    ],*/
          project: GetProject(req),
        })
        .populate("creator", undefined, usersModel)
        .populate("users", undefined, usersModel)
        .sort([["date", -1]])
        .exec(function (err, data) {
          if (err) {
            Respond({
              status: 400,
              data: { message: err },
              res: res,
            });
          } else {
            Respond({
              status: 200,
              data: data,
              res: res,
            });
          }
        });
    }
  });

  app.post(scope + "/s3-sign-parts", async function (req, res) {
    const parts = Number(req.body.parts);
    if (!parts || isNaN(parts)) {
      Respond({
        status: 422,
        data: { code: "partsNotDefined" },
        res: res,
      });
      return;
    }
    const params = {
      Bucket: config.S3Bucket,
      Key: req.body.key,
      UploadId: req.body.uploadId,
    };
    const promises = [];

    for (let index = 0; index < parts; index++) {
      promises.push(
        s3.getSignedUrlPromise("uploadPart", {
          ...params,
          PartNumber: index + 1,
        })
      );
    }
    const pres = await Promise.all(promises);
    const resData = pres.reduce((map, part, index) => {
      map[index] = part;
      return map;
    }, {});
    Respond({
      status: 200,
      data: resData,
      res: res,
    });
  });
  app.post(scope + "/s3-sign-part", async function (req, res) {
    const params = {
      Bucket: config.S3Bucket,
      Key: req.body.key,
      UploadId: req.body.UploadId,
      PartNumber: req.body.PartNumber,
    };
    s3.getSignedUrl("uploadPart", params, function (err, url) {
      Respond({
        status: 200,
        data: { url, err },
        res: res,
      });
    });
  });

  const videoConvert = async (video) => {
    AWS.config.mediaconvert = {
      endpoint: "https://vasjpylpa.mediaconvert.us-east-1.amazonaws.com",
    };
    AWS.config.region = config.S3.region;

    var params = {
      //"Queue": "JOB_QUEUE_ARN",
      UserMetadata: {
        Customer: "Amazon",
      },
      Role: "arn:aws:iam::167497174341:role/mc",
      Settings: {
        OutputGroups: [
          {
            Name: "File Group",
            OutputGroupSettings: {
              Type: "FILE_GROUP_SETTINGS",
              FileGroupSettings: {
                Destination: "s3://il-9997771/",
              },
            },
            Outputs: [
              {
                VideoDescription: {
                  ScalingBehavior: "DEFAULT",
                  TimecodeInsertion: "DISABLED",
                  AntiAlias: "ENABLED",
                  Sharpness: 50,
                  CodecSettings: {
                    Codec: "H_264",
                    H264Settings: {
                      InterlaceMode: "PROGRESSIVE",
                      NumberReferenceFrames: 3,
                      Syntax: "DEFAULT",
                      Softness: 0,
                      GopClosedCadence: 1,
                      GopSize: 90,
                      Slices: 1,
                      GopBReference: "DISABLED",
                      SlowPal: "DISABLED",
                      SpatialAdaptiveQuantization: "ENABLED",
                      TemporalAdaptiveQuantization: "ENABLED",
                      FlickerAdaptiveQuantization: "DISABLED",
                      EntropyEncoding: "CABAC",
                      Bitrate: 5000000,
                      FramerateControl: "SPECIFIED",
                      RateControlMode: "CBR",
                      CodecProfile: "MAIN",
                      Telecine: "NONE",
                      MinIInterval: 0,
                      AdaptiveQuantization: "HIGH",
                      CodecLevel: "AUTO",
                      FieldEncoding: "PAFF",
                      SceneChangeDetect: "ENABLED",
                      QualityTuningLevel: "SINGLE_PASS",
                      FramerateConversionAlgorithm: "DUPLICATE_DROP",
                      UnregisteredSeiTimecode: "DISABLED",
                      GopSizeUnits: "FRAMES",
                      ParControl: "SPECIFIED",
                      NumberBFramesBetweenReferenceFrames: 2,
                      RepeatPps: "DISABLED",
                      FramerateNumerator: 30,
                      FramerateDenominator: 1,
                      ParNumerator: 1,
                      ParDenominator: 1,
                    },
                  },
                  AfdSignaling: "NONE",
                  DropFrameTimecode: "ENABLED",
                  RespondToAfd: "NONE",
                  ColorMetadata: "INSERT",
                },
                AudioDescriptions: [
                  {
                    AudioTypeControl: "FOLLOW_INPUT",
                    CodecSettings: {
                      Codec: "AAC",
                      AacSettings: {
                        AudioDescriptionBroadcasterMix: "NORMAL",
                        RateControlMode: "CBR",
                        CodecProfile: "LC",
                        CodingMode: "CODING_MODE_2_0",
                        RawFormat: "NONE",
                        SampleRate: 48000,
                        Specification: "MPEG4",
                        Bitrate: 64000,
                      },
                    },
                    LanguageCodeControl: "FOLLOW_INPUT",
                    AudioSourceName: "Audio Selector 1",
                  },
                ],
                ContainerSettings: {
                  Container: "MP4",
                  Mp4Settings: {
                    CslgAtom: "INCLUDE",
                    FreeSpaceBox: "EXCLUDE",
                    MoovPlacement: "PROGRESSIVE_DOWNLOAD",
                  },
                },
                NameModifier: "_1",
              },
            ],
          },
        ],
        AdAvailOffset: 0,
        Inputs: [
          {
            AudioSelectors: {
              "Audio Selector 1": {
                Offset: 0,
                DefaultSelection: "NOT_DEFAULT",
                ProgramSelection: 1,
                SelectorType: "TRACK",
                Tracks: [1],
              },
            },
            VideoSelector: {
              ColorSpace: "FOLLOW",
            },
            FilterEnable: "AUTO",
            PsiControl: "USE_PSI",
            FilterStrength: 0,
            DeblockFilter: "DISABLED",
            DenoiseFilter: "DISABLED",
            TimecodeSource: "EMBEDDED",
            FileInput: "s3://il-9997771/mov_bbbsejz9o1622291526430.avi",
          },
        ],
        TimecodeConfig: {
          Source: "EMBEDDED",
        },
      },
    };

    // Create a promise on a MediaConvert object
    var endpointPromise = new AWS.MediaConvert({
      apiVersion: "2017-08-29",
      accessKeyId: config.S3.accessKeyId,
      secretAccessKey: config.S3.secretAccessKey,
    })
      .createJob(params)
      .promise();

    // Handle promise's fulfilled/rejected status
    endpointPromise.then(
      function (data) {
        console.log("Job created! ", data);
      },
      function (err) {
        console.log("Error", err);
      }
    );
  };

  app.post(scope + "/s3-complete-multipart-upload", async function (req, res) {
    /*
            interface Part {
              ETag: string
              PartNumber: number
            }
        */
    const params = {
      Bucket: config.S3Bucket,
      Key: req.body.Key,
      UploadId: req.body.UploadId,
      MultipartUpload: { Parts: req.body.Parts },
    };

    const can = await perms.can(
      req,
      res,
      "createObject",
      req.body.folder || null,
      GetProject(req)
    );

    if (!can.result) {
      await s3.abortMultipartUpload(params).promise();
      Respond({
        res: res,
        data: { code: "noPermissionToCreateObject" },
        status: 400,
      });
      return;
    }

    //

    const file = await s3.completeMultipartUpload(params).promise();

    let fileMeta = await s3
      .headObject({ Bucket: config.S3Bucket, Key: req.body.Key })
      .promise();

    const data = {
      location: file.Location,
      key: file.Key,
      type: fileMeta.ContentType,
      size: fileMeta.ContentLength,
      etag: fileMeta.ETag,
      name: req.body.name,
      user: can.data._id,
      folder: req.body.folder || null,
      project: GetProject(req),
    };

    const cData = {
      version: {
        key: null,
        location: data.location,
        etag: null,
        mimeType: data.type,
        size: data.size,
      },
      name: data.name,
      user: can.data._id,
      type: "file",
      mimeType: data.type,
      folder: data.folder,
      project: data.project || GetProject(req),
      size: data.size,
    };

    const obj = await afterUpload(data, "createObject", req, res);

    Respond({
      status: 200,
      data: data,
      res: res,
    });
  });

  app.get(scope + "/s3-get-preview/:file", async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "previewObject",
      req.params.file,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: "noAccessForPreviewObject" },
        status: 400,
      });
    }

    const odb = await db.appConnect(data.project);

    const objects = odb.model("object");
  });

  app.get(scope + "/project/:project/dashboard/comments", async (req, res) => {
    const dbv = await db.appConnect(req);
    const size = 40;
    const skip = ((req.query.page || 1) - 1) * size;
    const can = await perms.can(
      req,
      res,
      "monitorActivity",
      undefined,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: "noAccessForMonitorActivity" },
        status: 400,
      });
      return;
    }

    const object = await dbv.model("object");
    var usersModel = dbUsers.model("userRegister");

    const commentsModel = await dbv.model("comment");
    const commentsData = await commentsModel
      .find({ project: req.params.project })
      .skip(skip)
      .limit(size)
      .sort("-date")
      .populate("author", "firstName lastName", usersModel)
      .populate("post", "name", object)
      .exec();

    const resComments = JSON.parse(JSON.stringify(commentsData));

    for (let j = 0; j < resComments.length; j++) {
      resComments[j].ago = moment(resComments[j].date).fromNow();
    }
    Respond({
      res: res,
      data: resComments,
      status: 200,
    });
  });
  app.get(scope + "/project/:project/dashboard/activity", async (req, res) => {
    const dbv = await db.appConnect(req);
    const can = await perms.can(
      req,
      res,
      "monitorActivity",
      undefined,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: "noAccessForMonitorActivity" },
        status: 400,
      });
      return;
    }
    const object = await dbv.model("object");
    const versionsModel = await dbv.model("objectVersion");
    var usersModel = dbUsers.model("userRegister");
    const size = 40;
    const skip = ((req.query.page || 1) - 1) * size;
    const versionsData = await versionsModel
      .find(
        { project: req.params.project },
        "name previousName type size author type date action object project subtype"
      )
      .skip(skip)
      .limit(size)
      .sort("-date")
      .populate("author", "firstName lastName image", usersModel)
      .exec();
    const resVersions = JSON.parse(JSON.stringify(versionsData));
    for (let i = 0; i < resVersions.length; i++) {
      resVersions[i].ago = moment(resVersions[i].date).fromNow();
    }
    Respond({
      res: res,
      data: resVersions,
      status: 200,
    });
  });
  app.get(scope + "/project/:project/dashboard", async (req, res) => {
    const can = await perms.can(
      req,
      res,
      "monitorActivity",
      undefined,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: "noAccessForMonitorActivity" },
        status: 400,
      });
      return;
    }

    const dbv = await db.appConnect(req);

    const size = 40;

    const skip = ((req.query.page || 1) - 1) * size;

    const object = await dbv.model("object");
    const versionsModel = await dbv.model("objectVersion");
    var usersModel = dbUsers.model("userRegister");
    const versionsData = await versionsModel
      .find(
        { project: req.params.project },
        "name previousName type size author type date action object project subtype"
      )
      .skip(skip)
      .limit(size)
      .sort("-date")
      // .populate('object', undefined, object)
      .populate("author", "firstName lastName image", usersModel)
      .exec();

    const commentsModel = await dbv.model("comment");
    const commentsData = await commentsModel
      .find()
      .skip(skip)
      .limit(size)
      .sort("-date")
      .populate("author", "firstName lastName", usersModel)
      .populate("post", "name", object)
      .exec();

    const projectModel = dbUsers.model("project");
    projectModel.findById(GetProject(req), function (err, data) {
      const resVersions = JSON.parse(JSON.stringify(versionsData));
      const resComments = JSON.parse(JSON.stringify(commentsData));
      for (let i = 0; i < resVersions.length; i++) {
        resVersions[i].ago = moment(resVersions[i].date).fromNow();
      }
      for (let j = 0; j < resComments.length; j++) {
        resComments[j].ago = moment(resComments[j].date).fromNow();
      }
      if (data) {
        Respond({
          res: res,
          data: {
            activity: resVersions,
            comments: resComments,
            project: data,
          },
          status: 200,
        });
      } else {
        Respond({
          status: 400,
          data: err,
          res: res,
        });
      }
    });
  });
  app.post(scope + "/s3-create-multipart-upload", async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "createObject",
      req.body.folder,
      GetProject(req)
    );

    if (!can.result) {
      Respond({
        res: res,
        data: { code: "noPermissionToCreateObject" },
        status: 400,
      });
      return;
    }

    var createFileKey = function (name) {
      name = (name || "").toLowerCase().trim();
      if (!name) return createId();
      const nameArray = name.split(".");
      const ext = nameArray.pop();
      // only latins and numbers
      name = nameArray.join("").trim();
      name = name.replace(/[^a-zA-Z0-9.]/g, "");
      return name + createId() + (ext ? "." + ext : "");
    };

    const params = {
      Bucket: config.S3Bucket,
      Key: createFileKey(req.body.key),
      ContentType: req.body.type,
    };

    s3.createMultipartUpload(params, function (err, data) {
      if (data) {
        // data.Bucket = config.S3Bucket;
        Respond({
          status: 200,
          data: { data },
          res: res,
        });
      } else if (err) {
        // todo: s3 errors must handled and logged to separate server

        res.setHeader("Content-Type", err.type || "application/json");
        res.status(err.status);
        res.end({
          data: { code: "errorUploading" },
        });
        return;
        Respond({
          status: 400,
          data: { err: err },
          res: res,
        });
      }
    });
  });

  app.post(scope + "/remove-plugin/:pluginid", async (req, res) => {
    const prj = GetProject(req);
    const can = await perms.can(req, res, "$manageProject", prj);
    const dbv = await db.appConnect(req);
    const projectModel = dbUsers.model("project");
    if (can.result) {
      const pluginModel = await dbv.model("plugin");
      const plg = pluginModel.findById(req.params.pluginid);
      const projectObject = await projectModel.findById(plg.project);
      if (projectObject) {
        projectObject.plugins = projectObject.plugins || [];
        const i = projectObject.plugins.indexOf(plg.project);
        projectObject.plugins.splice(i, 1);
        await projectObject.save();
      }

      const rm = await plg.remove();
      Respond({
        status: 200,
        data: rm,
        res: res,
      });
    } else {
      Respond({
        res: res,
        data: { code: "noPermissionsToManageProject" },
        status: 400,
      });
    }
  });
  app.post(scope + "/add-plugin", async (req, res) => {
    const version = (req.body.version || "").trim();
    const slug = (req.body.slug || "").trim();
    const prj = GetProject(req);
    const can = await perms.can(req, res, "$manageProject", prj);
    const dbv = await db.appConnect(req);
    const projectModel = dbUsers.model("project");
    if (can.result) {
      const plugin = await dbv.model("plugin");
      var projectObject = await projectModel
        .findById(prj)
        .populate("plugins", undefined, plugin)
        .exec();
      if (projectObject.plugins.find((plg) => plg.slug === slug)) {
        Respond({
          status: 400,
          data: { code: "pluginAlreadyAdded" },
          res: res,
        });
        return;
      }

      plugin.create(
        {
          name: slug,
          slug: slug,
          version: version,
          addedBy: can.data.id,
          project: prj,
        },
        async (err, data) => {
          projectObject = await projectModel.findById(prj);
          projectObject.plugins = projectObject.plugins || [];
          projectObject.plugins.push(data._id);

          await projectObject.save();
          Respond({
            status: 200,
            data: data,
            res: res,
          });
        }
      );
    }
  });

  const _handlePlugin = async (req, res, type) => {
    // type: 'get' | 'post';
    if (!type) {
      Respond({
        status: 400,
        data: { code: "typeNotSpecified" },
        res: res,
      });
      return;
    }
    if (!req.params.project) {
      Respond({
        status: 400,
        data: { code: "projectNotSpecified" },
        res: res,
      });
      return;
    }
    if (!req.params.slug) {
      Respond({
        status: 400,
        data: { code: "pluginNotSpecified" },
        res: res,
      });
      return;
    }
    const dbv = await db.appConnect(req);
    const pluginsModel = dbv.model("plugin");
    const pm = await dbUsers
      .model("project")
      .findById(req.params.project)
      .populate({
        path: "plugins",
        model: pluginsModel,
      });

    if (pm) {
      const plugin = pm.plugins.find((plg) => plg.slug === req.params.slug);
      if (plugin) {
        // const file = './plugins/' + req.params.project + '/' + req.params.slug + '/get.index.js';
        const file = `./plugins/${req.params.slug}/${type}.index.js`;
        if (fs.existsSync(file)) {
          const api = require(file);
          if (api.init) {
            api.init(req, res);
          }
        } else {
          Respond({
            status: 404,
            data: { code: "pluginDoesNotExists" },
            res: res,
          });
        }
      } else {
        Respond({
          status: 404,
          data: { code: "pluginNotPresentInProject" },
          res: res,
        });
      }
    } else {
      Respond({
        status: 404,
        data: { code: "projectDoesNotExist" },
        res: res,
      });
    }
  };

  const handleGetPlugin = async (req, res) => {
    return await _handlePlugin(req, res, `get`);
  };
  const handlePostPlugin = async (req, res) => {
    return await _handlePlugin(req, res, `post`);
  };

  app.get(scope + "/project/:project/plugin/:slug", async (req, res) => {
    await handleGetPlugin(req, res);
  });

  app.post(scope + "/project/:project/plugin/:slug", async (req, res) => {
    await handlePostPlugin(req, res);
  });

  const handleServeUIPlugins = async (req, res) => {
    if (
      req.params.project &&
      !mongoose.Types.ObjectId.isValid(req.params.project)
    ) {
      Respond({
        status: 404,
        data: { code: "notFound" },
        res: res,
      });
      return;
    }
    const ext = (req.query.ext || "").trim();
    if (ext !== "js" && ext !== "css") {
      Respond({
        status: 404,
        data: "wrong extension",
        res: res,
      });
      return;
    }
    const key = "ui-plugins-" + req.params.project + "." + ext;
    const action = async () => {
      let res = [];
      if (fs.existsSync("./plugins/")) {
        fs.readdirSync("./plugins/", { withFileTypes: true }).forEach(
          (dirent) => {
            const dirName = dirent.name ? dirent.name : dirent;
            const fl = `./plugins/${dirName}/ui.index.${ext}`;
            if (dirent.isDirectory() && fs.existsSync(fl)) {
              const file = fs.readFileSync(fl, "utf8");
              res.push(file);
            }
          }
        );
      }

      const pluginsModel = dbUsers.model("plugin");
      const pm = await dbUsers
        .model("project")
        .findById(req.params.project)
        .populate({
          path: "plugins",
          model: pluginsModel,
        });

      if (pm) {
        for (let i = 0; i < pm.length; i++) {
          const slug = pm[i].slug;
          const fl = `./plugins/${slug}/ui.local.${ext}`;
          if (fs.existsSync(fl)) {
            const file = fs.readFileSync(fl, "utf8");
            res.push(file);
          }
        }
      }
      return res.join("");
    };

    const cache = require("./cache");

    const data = await cache.cachePromiseIfNotLocal(
      {
        key,
        action,
      },
      req
    );

    res.setHeader(
      "content-type",
      ext === "js" ? "application/javascript; charset=utf-8" : "text/css"
    );

    res.send(data);
  };

  app.get(scope + "/ui-plugins", async (req, res) => {
    handleServeUIPlugins(req, res);
  });
  app.get(scope + "/ui-plugins/:project", async (req, res) => {
    handleServeUIPlugins(req, res);
  });

  app.get(scope + "/module/", async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "createObject",
      req.body.folder,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: "noPermissionToCreateObject" },
        status: 400,
      });
    }
    const params = {
      Bucket: config.S3Bucket,
      Key: req.body.key,
      ContentType: req.body.type,
    };
    s3.createMultipartUpload(params, function (err, data) {
      if (data) {
        data.Bucket = config.S3Bucket;
        Respond({
          status: 200,
          data: { data },
          res: res,
        });
      } else if (err) {
        Respond({
          status: err.statusCode,
          data: { err: err },
          res: res,
        });
      }
    });
  });

  schemas.relation();
  schemas.appTokensOrder();

  app.get(scope + "/complete-credits-order", async function (req, res) {
    const stripeApi = require("./plugins/stripe/api");

    const creditsOrder = req.query["credits-order"];
    const payment_intent = req.query["payment_intent"];
    const payment_intent_client_secret =
      req.query["payment_intent_client_secret"];

    if (!appTools.tool.isValidObjectId(creditsOrder)) {
      Respond({
        status: 404,
        data: { code: "orderNotFound" },
        res: res,
      });
      return;
    }

    const model = dbUsers.model("appTokensOrder");
    const creditsOrderDoc = await model
      .findById(creditsOrder)
      .select("+dataSecret");
    if (!creditsOrderDoc) {
      Respond({
        status: 404,
        data: { code: "orderNotFound", v: 2 },
        res: res,
      });
      return;
    }

    if (creditsOrderDoc.status === "paid") {
      res.redirect(`${config.uiDomain}/billing?success=true`);
      return;
    }

    const isPaid = stripeApi.isPaid(payment_intent);

    if (!isPaid) {
      res.redirect(`${config.uiDomain}/billing?success=false`);
    } else {
      creditsOrderDoc.status = "paid";
      creditsOrderDoc.dataSecret = {
        payment_intent,
        payment_intent_client_secret,
      };

      await creditsOrderDoc.save();

      const userModel = dbUsers.model("userRegister");

      const userDoc = await userModel.findById(req.query.foruser);

      userDoc.appTokens = userDoc.appTokens + creditsOrderDoc.appTokens;

      await userDoc.save();

      res.redirect(
        `${config.uiDomain}/billing?success=true&value=${creditsOrderDoc.appTokens}`
      );
    }
  });

  app.post(scope + "/create-credits-order", async function (req, res) {
    const can = await perms.can(req, res, "$isLogged");
    if (!can.result) {
      Respond({
        status: 400,
        data: { code: "notLogged" },
        res: res,
      });
      return;
    }
    let appTokens = parseFloat(req.body.tokens);
    if (isNaN(appTokens) || !appTokens) {
      Respond({
        status: 400,
        data: { code: "invalidTokensValue" },
        res: res,
      });
      return;
    }

    const appTokensOrder = {
      author: can.data._id,
      forUser: can.data._id,
      paymentMethod: "card",
      appTokens,
    };
    const model = dbUsers.model("appTokensOrder");

    const order = await model.create(appTokensOrder);
    Respond({
      res: res,
      data: order,
      status: 200,
    });
  });

  app.get(scope + "/module", async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "createObject",
      req.body.folder,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: "noPermissionToCreateObject" },
        status: 400,
      });
    }
    const params = {
      Bucket: config.S3Bucket,
      Key: req.body.key,
      ContentType: req.body.type,
    };
    s3.createMultipartUpload(params, function (err, data) {
      if (data) {
        data.Bucket = config.S3Bucket;
        Respond({
          status: 200,
          data: { data },
          res: res,
        });
      } else if (err) {
        Respond({
          status: err.statusCode,
          data: { err: err },
          res: res,
        });
      }
    });
  });
};
