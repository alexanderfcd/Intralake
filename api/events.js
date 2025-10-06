var db = require("./db");
var illog = require("./services/log");

var dbUsers = db.users();
var dbApp = db.app();

const events = require("events");

eventEmitter = new events.EventEmitter();

eventEmitter.on("objectCreated", (data) => {
  console.log("objectCreated", data);
});

eventEmitter.on("versionCreated", async (data) => {
  const projectModel = dbUsers.model("project");

  const project = await projectModel.findById(data.project);

  console.log("versionCreated", data);
});
eventEmitter.on("objectDeleted", (data) => {});
eventEmitter.on("objectRenamed", (data) => {});

eventEmitter.on("objectPreview", (objdata, version) => {
  console.log(objdata, version);
  console.log(illog);
});

eventEmitter.on("newVersionUploaded", (version, object) => {
  //  console.log(object)
});

eventEmitter.on("nonExistingUserAddedToRole", (role, email) => {});
eventEmitter.on("userLogIn", async (userData) => {
  afterSignIn(userData);
});
eventEmitter.on("userHaveRegistered", async (userData) => {
  afterSignIn(userData);
});
eventEmitter.on("search", (data) => {});

const afterSignIn = async (userData) => {
  const tempInvitationModel = dbUsers.model("tempInvitation");
  const tempInvitation = await tempInvitationModel.findOne({
    email: userData.email,
  });
  const roleModel = dbUsers.model("role");
  const projectModel = dbUsers.model("project");

  if (tempInvitation) {
    const role = await roleModel.findById(tempInvitation.role);
    const project = await projectModel.findById(tempInvitation.project);

    if (role && project) {
      if (!role.users) {
        role.users = [];
      }
      role.users.push(userData._id);
      if (!project.users) {
        project.users = [];
      }
      project.users.push(userData._id);
      if (!userData.projects) {
        userData.projects = [];
      }
      userData.projects.push(project._id);
      if (!userData.roles) {
        userData.roles = [];
      }
      userData.roles.push(role._id);
      role.invitations.splice(
        role.invitations.indexOf("" + tempInvitation._id),
        1
      );
      await userData.save();
      await role.save();
      await project.save();
    }
    await tempInvitation.remove();
  }
};

module.exports = eventEmitter;
