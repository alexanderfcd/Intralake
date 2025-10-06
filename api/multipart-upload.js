const path = require("path");
const config = require("./config");
const fs = require("fs");
const perms = require("./perms");

const convert2 = require("./convert2");
const extensionCheck = require("./ext");

const QBody = require("./qbody");
const createId = function () {
  return Math.random().toString(36).substring(7) + new Date().getTime();
};

const deleteFolderRecursive = function (directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file, index) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
};

const needConvert = (name) => {
  const ext = name.split(".").pop();

  return extensionCheck.needConvert(ext);
};

const multer = require("multer");
const db = require("./db");

var dbUsers = db.users();
var dbApp = db.app();

const afterUpload = require("./after-upload");

const beforeUploadCreate = async (req, res) => {
  const qb = QBody(req);
  const name = (qb.body.name || "").trim();
  const type = (qb.body.type || "").trim();
  const folder = (qb.body.folder || "").trim() || null;
  const project = GetProject(req);

  if (!project) {
    Respond({
      res: res,
      data: { message: "Project not specified" },
      status: 403,
    });
    return false;
  }

  const can = await perms.can(req, res, "createObject", folder, project);

  if (!can.result) {
    Respond({
      res: res,
      data: { code: "noPermissionsToCreateObject" },
      status: 400,
    });
    return false;
  }
  const user = can.data;

  const objects = (await db.appConnect(req)).model("object");

  const exists = await objects
    .findOne({ name: name, folder: folder, project: project })
    .exec();

  if (exists) {
    Respond({
      res: res,
      data: { code: "objectNameExists" },
      status: 400,
    });
    return false;
  }

  return can.data;
};

const beforeUploadVersion = async (req, res) => {
  const can = await perms.can(
    req,
    res,
    "modifyObject",
    req.params.objectId,
    req.body.project
  );
  if (!can || !can.result) {
    Respond({
      res: res,
      data: { code: "noPermissionsToModifyObject" },
      status: 400,
    });
    return false;
  }
  return can.data;
};

const beforeUpload = async (req, res, type) => {
  // execute on 1st chunk
  if (!type || type === "createObject") {
    return beforeUploadCreate(req, res);
  } else if (type === "modifyObject") {
    return beforeUploadVersion(req, res);
  }
};

module.exports = async (req, res) => {
  if (req.body.abort) {
    clearOldChunks();
    Respond({
      res: res,
      data: { message: "abort" },
      status: 200,
    });
    return;
  }
  if (!req.body.index || !req.body.name || !req.body.total || !req.files[0]) {
    Respond({
      res: res,
      data: { message: "error" },
      status: 400,
    });
  }

  const numberIndex = Number(req.body.index);

  let id;

  if (numberIndex === 0) {
    const rand = Math.floor(Math.random() * (1 - 99999 + 1)) + 99999;
    id = new Date().getTime() + "" + rand;
    const canUpload = await beforeUpload(req, res, req.query.type);
    if (!canUpload) {
      Respond({
        res: res,
        data: { message: "error" },
        status: 400,
      });
      return;
    }
  } else {
    id = req.body.id;
  }

  if (!id) {
    Respond({
      res: res,
      data: { message: "error", key: "id" },
      status: 400,
    });
  }

  const chunksFolder = __dirname + path.sep + "chunks";
  const dir = chunksFolder + path.sep + id;
  const targetDir = __dirname + path.sep + config.serverUploadFolder;

  const extarr = req.body.name.split(".");
  const ext2 = extarr.length > 1 ? "." + extarr.pop() : "";
  const nameID = createId() + ext2;

  const clearOldChunks = async () => {
    var max = new Date();
    max.setHours(max.getHours() - 24);
    const dirs = fs
      .readdirSync(__dirname + path.sep + "chunks", { withFileTypes: true })
      .filter((dir) => {
        const isDir = dir.isDirectory();
        if (!isDir) return false;
        const stats = fs.statSync(chunksFolder + path.sep + dir.name);
        return max > stats.mtime;
      })
      .map((dir) => dir.name);

    dirs.forEach((dir) => {
      deleteFolderRecursive(chunksFolder + path.sep + dir);
    });
  };

  if (numberIndex === 0) {
    await fs.promises.mkdir(dir);
  }
  fs.writeFile(
    dir + path.sep + req.body.index + ".part",
    req.files[0].buffer,
    async (err) => {
      if (err) throw err;
      if (numberIndex === req.body.total - 1) {
        const parts = [];

        for (let i = 0; i <= numberIndex; i++) {
          parts.push(await fs.promises.readFile(`${dir}${path.sep}${i}.part`));
        }

        const filePath = `${targetDir}${path.sep}${nameID}`;
        const wr = await fs.promises.writeFile(filePath, Buffer.concat(parts));
        // await fs.promises.rmdir(dir, { recursive: true, force: true });
        deleteFolderRecursive(dir);
        const name = req.body.name.trim();
        const token = appTools.tool.getToken(req),
          users = dbUsers.model("userRegister");
        const user = await users.findOne({ token: token }).exec();
        var stats = fs.statSync(filePath);

        const data = {
          location: nameID,
          type: req.body.type,
          action: req.query.action,
          size: stats.size,
          name: name,
          user: user._id,
          folder: req.body.folder || null,
          project: GetProject(req),
        };

        console.log(needConvert(name));

        let conv;
        if (needConvert(name)) {
          conv = await convert2(name, filePath, req.body.type);
        }

        if (conv) {
          data.resultConvert = !!conv.data;
          data.dataConvert = conv;
        }
        const obj = await afterUpload(data, req.query.type, req, res);

        const resp = {
          res: res,
          data: {
            complete: true,
            error: false,
            data: obj.data,
          },
          status: 200,
        };

        if (obj.error) {
          resp.data.error = true;
          resp.status = 400;
        }

        Respond(resp);
        return;
      }
      Respond({
        res: res,
        data: { complete: false, id: id },
        status: 200,
      });
    }
  );

  clearOldChunks();
};
