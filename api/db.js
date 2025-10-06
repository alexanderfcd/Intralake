const mongoose = require("mongoose");
const Schema = mongoose.Schema;

config = require("./config");

const globalOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const AppConnection = {};

const connectToProjectDBCache = {
  projectId: null,
  data: null,
};

const _dbapp = (url) => {
  url = url || config.mongoURLObjects;
  if (AppConnection[url]) {
    return AppConnection[url];
  } else {
    AppConnection[url] = mongoose.createConnection(url, globalOptions);
    // AppConnection[url].on('error', function (err) {  });
    return AppConnection[url];
  }
};

const _projectData = async (projectId) => {
  return new Promise(async (resolve) => {
    if (projectId === connectToProjectDBCache.projectId) {
      resolve(connectToProjectDBCache.data);
    } else {
      const data = await _users()
        .model("project")
        .findById(projectId)
        .select("+databaseUrl");
      connectToProjectDBCache.projectId = projectId;
      connectToProjectDBCache.data = data;
      resolve(data);
    }
  });
};

const _users = () => {
  if (!this._usersConnected) {
    this._usersConnected = mongoose.createConnection(
      config.mongoURLUsers,
      globalOptions
    );
  }
  return this._usersConnected;
};

module.exports = {
  _usersConnected: false,
  mongoose: function () {
    return mongoose;
  },
  app: (url) => {
    return _dbapp(url);
  },
  appConnect: async (reqOrId) => {
    if (!reqOrId) {
      return _dbapp();
    }
    let id = reqOrId;
    if (reqOrId.body || reqOrId.headers) {
      id = GetProject(reqOrId);
    }
    if (!id) return;

    const data = await _projectData(id);

    return _dbapp(data.databaseUrl);
  },
  getAppModel: async (reqOrId, schemaName) => {
    const db_app = await module.exports.appConnect(reqOrId);
    return db_app.model(schemaName);
  },
  users: () => {
    return _users();
  },
};
