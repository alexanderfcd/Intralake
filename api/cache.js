const fs = require("fs");

const cacheFolder = "./cache";
const cacheDefaultTime = 5 * 60000;

module.exports = {
  clear: (key) => {
    const cacheName = cacheFolder + "/" + key;
    if (fs.existsSync(cacheName)) {
      fs.unlinkSync(cacheName);
    }
  },
  cachePromiseIfNotLocal: async (options, req) => {
    if (req.connection.remoteAddress === "127.0.0.1") {
      return options.action();
    } else {
      return module.exports.cachePromise(options);
    }
  },
  cachePromise: async (options) => {
    options = options || {};
    const type = options.type || "string"; // 'json' | 'string'

    return new Promise(async (resolve) => {
      if (!options.key || !options.action) {
        resolve();
        return;
      }
      if (!fs.existsSync(cacheFolder)) {
        fs.mkdirSync(cacheFolder);
      }
      const cacheName = cacheFolder + "/" + options.key;

      const action = async () => {
        const res = await options.action();
        let cacheRes = res;
        if (typeof cacheRes !== "string") {
          cacheRes = JSON.parse(cacheRes);
        }

        fs.writeFile(cacheName, cacheRes, function (err) {
          if (err) throw err;
          resolve(res);
        });
      };
      const theTime = options.time || cacheDefaultTime;
      if (fs.existsSync(cacheName)) {
        const { mtime } = fs.statSync(cacheName);
        const fileDate = new Date(mtime).getTime();
        const currDate = Date.now();
        if (currDate - fileDate < theTime) {
          fs.readFile(cacheName, "utf8", (err, data) => {
            if (err) {
              return console.log(err);
            }
            if (type === "json") {
              resolve(JSON.parse(data));
            } else if (type === "string") {
              resolve(data);
            }
          });
        } else {
          action();
        }
      } else {
        action();
      }
    });
  },
};
