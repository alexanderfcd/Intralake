const { S3Upload, S3CoreUpload, S3SimpleUpload } = require("./s3-upload");

const fs = require("fs");
const path = require("path");
const config = require("./config");

const targetDir = __dirname + path.sep + config.serverUploadFolder;

module.exports = async (buffer, name) => {
  if (!name) {
    name = `file-upload-${Date.now()}`;
  }
  if (config.uploadMode === "s3") {
    return await S3SimpleUpload(buffer, name);
  } else {
    const filePath = `${targetDir}${path.sep}${name}`;

    return new Promise(async (resolve, reject) => {
      fs.writeFile(
        filePath,
        Buffer.from(await buffer.arrayBuffer()),
        function (err, data) {
          if (err) throw err;
          resolve(data);
        }
      );
    });
  }
};
