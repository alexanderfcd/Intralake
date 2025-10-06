const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const config = require("./config");
const extensionCheck = require("./ext");
const AWS = require("aws-sdk");

const s3 = new AWS.S3(config.S3);

const createId = function () {
  return Math.random().toString(36).substring(7) + new Date().getTime();
};

const copyToS3 = async (fd, mime, nameID) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fd, (error, buffer) => {
      s3.putObject(
        {
          ContentType: mime,
          Key: nameID,
          Bucket: config.S3Bucket,
          Body: buffer, // buffer
        },
        function (err, data) {
          if (data) {
            data.Key = nameID;
            data.mime = mime;
            // data.key = nameID;
            // data.Location = config.S3Config.getLocationByKey(nameID);
          }
          resolve({ err, data });
        }
      );
    });
  });
};

const moveToS3 = async (fd, mime, nameID, resultPath) => {
  const result = await copyToS3(fd, mime, nameID);
  fs.unlinkSync(resultPath || fd);
  return result;
};

const convert2 = async (name, filepath, originalMime) => {
  return new Promise(async (resolve) => {
    let to;

    let arr = filepath.split(".");
    const ext = arr.pop();

    const isDocument = extensionCheck.needConvertAsDocument(ext);
    const isVideo = extensionCheck.needConvertAsVideo(ext);
    // todo: const isPSD = extensionCheck.needConvertAsPSD(ext) ;
    const isPSD = false;
    if (isPSD) {
      to = "png";
    } else if (isDocument) {
      to = "pdf";
    } else if (isVideo) {
      to = "mp4";
    }

    const resultPath = arr.join(".") + "." + to;

    let outputDir = filepath.split(path.sep);
    const targetName = outputDir.pop();
    outputDir = outputDir.join(path.sep);

    let cmd, mime;
    if (to === "pdf") {
      mime = "application/pdf";
      if (process.platform === "win32") {
        cmd =
          '"' +
          config.windows.libreofficePath +
          'soffice"  --convert-to ' +
          to +
          " --outdir " +
          outputDir +
          " " +
          filepath;
      } else {
        cmd =
          "libreoffice  --convert-to " +
          to +
          " --outdir " +
          outputDir +
          " " +
          filepath;
      }
    } else if (to === "png") {
      mime = "image/png";
      var PSD = require("psd");
    } else if (to === "mp4") {
      mime = "video/mp4";
      if (process.platform === "win32") {
        cmd =
          '"' +
          config.windows.ffmpegPath +
          'ffmpeg" -i ' +
          filepath +
          " -c:v libx264 -crf 31 -preset superfast " +
          resultPath;
      } else {
        cmd =
          "ffmpeg -i " +
          filepath +
          " -c:v libx264 -crf 31 -preset superfast " +
          resultPath;
      }
    }

    const pathBase = (filepath || name).split("/").map(function (item) {
      return item.trim();
    });

    const nameBase = pathBase.pop().split(".")[0];
    name = name || nameBase + "." + to;

    let fd;

    fd = pathBase.join("/") + "/" + nameBase + "." + to;
    if (fd.indexOf("/") === 0) {
      fd = fd.substring(1);
    }
    if (fd.indexOf("\\") === 0) {
      fd = fd.substring(1);
    }

    const { exec } = require("child_process");

    const ls = exec(cmd, async function (error, stdout, stderr) {
      if (config.uploadMode === "s3") {
        const nameID = createId() + "." + to;
        if (error) {
          resolve({ error: true, errorData: error });
        }

        const result = await moveToS3(fd, mime, nameID, resultPath);
        const resultOriginal = await moveToS3(
          filepath,
          originalMime,
          targetName
        );

        resolve({ ...result, resultOriginal });
      } else {
        resolve({
          err: null,
          data: { Location: targetName.split(".")[0] + "." + to, mime },
        });
      }
    });
  });
};

module.exports = convert2;
