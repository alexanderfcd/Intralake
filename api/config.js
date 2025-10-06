const configLocal = require("./config.local.js");

const DEFAULT_ENCRYPTION = async (str) => {
  return new Promise((resolve) => {
    resolve(require("md5")(str));
  });
};

const DEFAULT_COMPARE = async (password, hash) => {
  return new Promise((resolve) => {
    resolve(require("md5")(password) === hash);
  });
};

const BCRYPT_ENCRYPTION = async (str) => {
  return new Promise((resolve) => {
    const bcrypt = require("bcrypt");
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(str, salt, function (err, hash) {
        resolve(hash);
      });
    });
  });
};

const BCRYPT_COMPARE = async (password, hash) => {
  return new Promise((resolve) => {
    const bcrypt = require("bcrypt");
    bcrypt.compare(password, hash, function (err, result) {
      resolve(result);
    });
  });
};

let mongo = {
  mongoUser: false,
  mongoPass: false,
  mongoPath: "127.0.0.1:27017/admin",

  /* Users DB */
  usersMongoUser: false,
  usersMongoPass: false,

  usersMongoPath: "127.0.0.1:27017/admin",
  srv: false,

  activeProjectDatabases: [
    {
      user: false,
      pass: false,
      path: "127.0.0.1:27017/admin",
      index: 0,

      logDB: "127.0.0.1:27017/admin",
      logDBUser: false,
      logDBPass: false,
    },
    {
      user: false,
      pass: false,
      path: "127.0.0.1:27017/admin",
      index: "127.0.0.1:27017/admin",

      logDB: "127.0.0.1:27017/admin",
      logDBUser: false,
      logDBPass: false,
    },
  ],
};

let S3Config = {
  endpoint: "https://nyc3.digitaloceanspaces.com",
  region: "nyc3",
  accessKeyId: "",
  secretAccessKey: "",
  regionPrefix: "",
};
let S3Bucket = "";

const S3 = {
  endpoint: S3Config.endpoint,
  accessKeyId: S3Config.accessKeyId,
  secretAccessKey: S3Config.secretAccessKey,
  region: S3Config.region,
  s3ForcePathStyle: false,
};

S3Config.getLocationByKey = function (key) {
  const s3p = S3Config.endpoint.includes("amazon") ? ".s3" : "";
  const backblazePrefix = S3Config.endpoint.includes("backblaze") ? "s3." : "";
  return (
    S3Config.endpointProtocol +
    backblazePrefix +
    S3Bucket +
    s3p +
    "." +
    S3Config.region +
    "." +
    S3Config.endpoint +
    "/" +
    key
  );
};

const protocol = "http";

const mongoURLObjects =
  (mongo.srv ? "mongodb+srv://" : "mongodb://") +
  (mongo.mongoUser && mongo.mongoPass
    ? mongo.mongoUser + ":" + encodeURIComponent(mongo.mongoPass) + "@"
    : "") +
  mongo.mongoPath;
const mongoURLUsers =
  (mongo.srv ? "mongodb+srv://" : "mongodb://") +
  (mongo.usersMongoUser && mongo.usersMongoPass
    ? mongo.usersMongoUser +
      ":" +
      encodeURIComponent(mongo.usersMongoPass) +
      "@"
    : "") +
  mongo.usersMongoPath;

const uiConfig = {};

const config = {
  requireProfileConfirmation: true, // profile must have .confirmed: true
  windows: {
    libreofficePath: "C:\\Program Files\\LibreOffice\\program\\",
    ffmpegPath: "C:\\ffmpeg\\bin\\",
  },
  protocol,

  remoteConfig: {
    type: "s3",
    access: {
      endpoint:
        S3Config.endpointProtocol +
        (S3Config.regionPrefix || "") +
        S3Config.region +
        "." +
        S3Config.endpoint,
      accessKeyId: S3Config.accessKeyId,
      secretAccessKey: S3Config.secretAccessKey,
      region: S3Config.region,
      s3ForcePathStyle: false,
    },
  },

  certificateProvider: "localOpenSSL",

  apiDomain: protocol + "://localhost:777",
  uiDomain: protocol + "://localhost:801",
  restorePasswordPathLink: "/restore-password",
  mongo: mongo,
  staticPath: "static",
  mongoURLObjects,
  mongoURLUsers,

  projectDataBaseURLGenerator: async () => {
    return new Promise((resolve) => {
      resolve(mongoURLUsers + ("db" + new Date().getTime()));
    });
  },

  site: {
    shortName: "IntraLake",
  },
  mail: {
    email: "",
    logoURL: "",
    logoURLAlt: "",
    logoWidth: "157",
    logoHeight: "41",
    teamName: "",
    footer: "",
    header: "",
  },
  mailgun: {
    api_key: "",
  },
  sendgrid: {
    api_key: "",
    // sendgrid requires sender email
    // https://app.sendgrid.com/settings/sender_auth/senders
    // if not provided or is different a 403 error will appear
    senderFrom: "",
  },
  stripe: {
    secret: "",
    public: "",

    paymentPagePath: "/checkout",
    methods: ["card"],
  },
  adapters: {
    email: "noop", //mailgun, sendmail, noop, nodemailer, sendgrid,
  },

  sendgrid: {
    api_key: "SG.",

    senderFrom: "no-reply@example.com",
  },

  physicalDelete: true,
  S3: S3,
  S3Config: S3Config,
  S3Bucket: S3Bucket,

  uploadMode: "s3", // server | s3
  serverUploadFolder: "uploaded",

  accessAttributesParenting: "circular", // parent, circular, none

  encryption: DEFAULT_ENCRYPTION, // if changed after deployment user will not be able to log in,
  encryptionCompare: DEFAULT_COMPARE,

  //encryption: BCRYPT_ENCRYPTION,
  //encryptionCompare: BCRYPT_COMPARE,

  globalPlugins: {
    concert: true,
    openai: true,
    "event-manager": false,
    qr: true,
    streamposts: true,
    stripe: true,
    "core-tools": true,
    "document-sign": true,
  },
  TZ: "Europe/Sofia",

  emails: {
    passwordReset: function (linkUrl, data) {
      const { req, res } = data;

      const lang =
        data && data.req && data.req.cookies && data.req.cookies.illang
          ? data.req.cookies.illang
          : "en";

      var html = '<p style="padding-bottom:20px;">Hi, <br>';
      html += "There was a request to change your password.<br>";
      html += "If you did not make this request, just ignore this email.<br>";
      html += "</p>";
      html += this.button("Reset my password", linkUrl);
      var mail = this.wrap(html);
      return {
        html: mail,
        subject: config.site.shortName + " Password reset",
      };
    },
  },
};

config.mail.footer =
  '<p style="padding-top:30px;">Kind Regards,<br>' +
  config.mail.teamName +
  " Team</p>";
config.mail.header =
  '<p style="padding-bottom:30px;"><img src="' +
  config.mail.logoURL +
  '" alt="' +
  config.mail.logoURLAlt +
  '" width="' +
  config.mail.logoWidth +
  '" height="' +
  config.mail.logoHeight +
  '" style="width:' +
  config.mail.logoWidth +
  "px;height:" +
  config.mail.logoHeight +
  'px;"></p>';

const settings = Object.assign({}, config, configLocal);

module.exports = settings;
