appTools = {};

const config = require("./config");

const http = require("http");
let https;
if (config.protocol === "https") {
  https = require("https");
}

const vm = require("vm");

const _configLoader = async (id) => {
  return new Promise((resolve) => {});
};
const configLoader = async (id) => {
  return new Promise((resolve) => {
    const config = require("./config");
  });
};

configLoader();

// process.env.TZ = config.TZ || config.tz;

const mongoose = require("mongoose");

const sertificateService = {
  localOpenSSL: () => {
    return {
      key: fs.readFileSync("./ssl/cert.key"),
      cert: fs.readFileSync("./ssl/cert.pem"),
    };
  },
  letsEncrypt: () => {
    const host = config.apiDomain
      .replace(config.protocol + "://", "")
      .split(":")[0];
    const privateKey = fs.readFileSync(
      "/etc/letsencrypt/live/" + host + "/privkey.pem",
      "utf8"
    );
    const certificate = fs.readFileSync(
      "/etc/letsencrypt/live/" + host + "/cert.pem",
      "utf8"
    );
    const ca = fs.readFileSync(
      "/etc/letsencrypt/live/" + host + "/chain.pem",
      "utf8"
    );

    return {
      key: privateKey,
      cert: certificate,
      ca: ca,
    };
  },
};

const express = require("express");

const multer = require("multer");

appTools.tool = require("./tools");
jsonstring = require("./jsonstring");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");

var emailTemplates = require("./emails");

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  windowMs: 1000, // 1 s
  limit: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Redis, Memcached, etc. See below.
});

// Apply the rate limiting middleware to all requests.
app.use(limiter);

app.disable("x-powered-by");

const compression = require("compression");

app.use(compression());

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use(cookieParser());

app.set("port", config.port || 80);

appSeparator = path.sep === "/" ? "/" : "\\"; // single backslash is ignored

app.use(
  "/static",
  express.static(__dirname + appSeparator + config.staticPath)
);

app.locals.getDate = appTools.tool.getDate;

EqualIds = function (id1, id2) {
  return `${id1}` === `${id2}`;
};

ObjectsArrayContainsId = function (array, id) {
  return ArrayContainsId(array, id);
};
ArrayContainsId = function (array, id) {
  if (!array || !array[0]) return false;
  if (array[0]._id) {
    for (let i = 0; i < array.length; i++) {
      if (EqualIds(array[i]._id, id)) {
        return true;
      }
    }
  } else {
    for (let i = 0; i < array.length; i++) {
      if (EqualIds(array[i], id)) {
        return true;
      }
    }
  }
  return false;
};

Respond = function (obj) {
  const res = obj.res;
  if (!res.headersSent) {
    res.setHeader("Content-Type", obj.type || "application/json");
    res.status(obj.status);
    res.end(prepareRespondData(obj.data));
  } else {
    console.log("headersSent", obj.data);
  }
};

isValidId = function (id, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    if (res) {
      Respond({
        status: 403,
        data: { code: "invalidId" },
        res: res,
      });
    }
    return false;
  }
  return true;
};

const prepareRespondData = (data) => {
  return JSON.stringify(data);
};

dbQuery = async (modelObject, method, data) => {
  return new Promise((resolve) => {
    if (typeof data !== "undefined") {
      modelObject[method](function (err, data) {
        resolve({ err, data });
      });
    } else {
      modelObject[method](data, function (err, data) {
        resolve({ err, data });
      });
    }
  });
};

noError = function (err, res) {
  if (err) {
    Respond({
      status: 400,
      data: err,
      res: res,
    });
    return false;
  } else {
    return true;
  }
};

GetProject = function (req) {
  if (!req) return "";
  let project = "";
  if (req.params && req.params.project) {
    project = req.params.project;
  }
  if (req.body && req.body.project) {
    project = req.body.project;
  }
  if (req.query.project) {
    project = req.query.project;
  }
  if (req.headers && req.headers.project) {
    project = req.headers.project;
  }
  if (req.headers && req.headers.Project) {
    project = req.headers.Project;
  }

  return appTools.tool.isValidObjectId(project) ? project : "";
};

app.use(cors());
app.set("view engine", "ejs");

app.use(async (req, res, next) => {
  next();
});

require("./router")(app);

const db = require("./db");

const dbUsers = db.users();
const dbApp = db.app();

try {
  const sharp = require("sharp");
} catch (e) {
  if (e instanceof Error && e.code === "MODULE_NOT_FOUND")
    console.log("Can't load sharp!");
  else throw e;
}

const imageEditor = (buffer) => {
  return sharp(buffer);
};

modulesUploader = multer({
  limits: {
    fileSize: 1000000,
  },
});

// init all plugins
const mng = db.mongoose();
fs.readdirSync("./plugins", { withFileTypes: true }).forEach((dirent) => {
  var dirName = dirent.name ? dirent.name : dirent;
  const enabled =
    !config.globalPlugins || config.globalPlugins[dirName] === true;
  if (enabled && fs.existsSync(`./plugins/${dirName}/index.main.js`)) {
    const plugin = require(`./plugins/${dirName}/index.main.js`);
    const options = {
      app,
      dirName,
      dbUsers,
      dbApp,
      db,
      mongoose: mng,
      express,
      config,
      modulesUploader,
      imageEditor,
      tools: appTools.tool,
      createEmail: emailTemplates.defaultEmail,
    };
    plugin(options);
  }
});

const ip = "0.0.0.0";

if (https) {
  let http2;
  try {
    // todo integrate http2
    // http2 = require('node:http2');
  } catch (err) {
    console.error("http2 support is disabled!");
  }

  if (config.certificateProvider) {
    if (sertificateService[config.certificateProvider]) {
      let httpsServer;
      if (http2) {
        httpsServer = http2.connect(
          sertificateService[config.certificateProvider](),
          app
        );
      } else {
        httpsServer = https.createServer(
          sertificateService[config.certificateProvider](),
          app
        );
        httpsServer.listen(443, () => {
          console.log("HTTPS Server running on port 443");
        });
      }
    } else {
      console.log(
        "sertificateService." + config.certificateProvider + " is not defined"
      );
    }
  } else {
    console.log("No certificateProvider provided");
  }
}

http.createServer(app).listen(app.get("port"), ip, function () {
  console.log("Express server listening on port " + app.get("port"));
});
