const config = require("./config");

const AWS = require("aws-sdk");
const fs = require("fs");

const conf = { ...config.S3 };
delete conf.regionPrefix;
delete conf.getLocationByKey;
// delete conf.region;
// conf.endpoint = 'http://s3.amazonaws.com';

const s3 = new AWS.S3({ ...conf });

const S3Upload = async (params) => {
  return new Promise(async (resolve) => {
    s3.upload(params, function (err, data) {
      resolve({ data, err });
    });
  });
};

// this must be used as a final solution for system private files - like 'signs'
const S3SimpleUpload = async (buffer, name) => {
  const params = Object.assign({}, config.S3, { Bucket: config.S3Bucket });
  params.Body = buffer;
  params.Key = name;
  return await S3Upload(params);
};
const S3CoreUpload = async (buffer, name) => {
  return new Promise(async (resolve) => {
    const path = __dirname + "/" + config.staticPath + "/" + name;
    fs.writeFile(path, buffer, async function (err) {
      let conv;
      if (needConvert(name)) {
        conv = await convert2(name, path);
      }
      const params = Object.assign({}, config.S3, { Bucket: config.S3Bucket });
      params.Body = buffer;
      params.Key = name;
      // params.ContentType = 'application/octet-stream';
      const mainObject = await S3Upload(params);

      const result = {
        result: !!mainObject.data,
        data: mainObject.data || mainObject.err,
      };

      if (conv) {
        result.resultConvert = !!conv.data;
        result.dataConvert = conv;
      }

      fs.unlinkSync(path);

      resolve(result);
    });
  });
};

module.exports = {
  S3SimpleUpload,
  S3Upload,
  S3CoreUpload,
  s3,
};
