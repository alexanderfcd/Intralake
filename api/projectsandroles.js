const db = require("./db");
const mongoose = db.mongoose();
const dbUsers = db.users();
const perms = require("./perms");

const lang = function (val) {
  return val;
};

let schemas = require("./schemas");
schemas = new schemas();

var emailTemplates = require("./emails");

module.exports = {
  getProjects: async (req, res) => {
    const projectModel = dbUsers.model("project");
    const can = await perms.can(req, res, "$isLogged");
    if (can.result) {
      const projects = await projectModel.find({
        $or: [
          { users: { $in: [can.data._id] } },
          { owner: can.data._id },
          { creator: can.data._id },
        ],
      });
      Respond({
        status: 200,
        data: projects,
        res: res,
      });
    }
  },
  projectId: async (req, res) => {
    const can = await perms.can(req, res, "$accessProject", req.params.id);
    if (can.result) {
      const projectModel = dbUsers.model("project");
      projectModel.findById(req.params.id, function (err, data) {
        if (data) {
          Respond({
            status: 200,
            data: data,
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
  },

  updateProject: async (req, res, qb) => {
    const projectModel = dbUsers.model("project");
    projectModel.findById(req.params.id, async function (err, data) {
      if (err) {
        Respond({
          status: 403,
          data: err,
          res: res,
        });
      } else {
        const tosave = {};
        const bod = qb.body;
        if (bod.name) {
          tosave.name = bod.name.trim();
        }
        if (bod.description) {
          tosave.description = bod.description.trim().substring(0, 70);
        }

        if (bod.image) {
          if (bod.image === "delete") {
            tosave.image = null;
          } else {
            tosave.image = bod.image.trim();
          }
        }
        for (const i in tosave) {
          data[i] = tosave[i];
        }

        await data.save(function (err) {
          if (err) {
            Respond({
              status: 400,
              data: { error: err },
              res: res,
            });
          } else {
            Respond({
              status: 200,
              data: { message: lang("Project updated") },
              res: res,
            });
          }
        });
      }
    });
  },
  createProject: async (req, res) => {
    const can = await perms.can(req, res, "$createProject");
    if (can.result) {
      const projectModel = dbUsers.model("project");
      const user = can.data;
      projectModel.create(
        {
          name: req.body.name,
          owner: user._id,
          creator: user._id,
          databaseUrl: config.projectDataBaseURLGenerator
            ? await config.projectDataBaseURLGenerator()
            : null,
        },
        function (err, data) {
          user.projects = user.projects || [];
          user.projects.push(data._id);
          user.save(function (err, udata) {
            Respond({
              status: 200,
              data: { message: lang("Project created") },
              res: res,
            });
          });
        }
      );
    } else {
      Respond({
        status: 403,
        data: { code: "noPermissionToCreateProject" },
        res: res,
      });
    }
  },
  createRole: async (req, res) => {
    const name = (req.body.name || "").trim();
    const project = GetProject(req);
    if (!name) {
      Respond({
        status: 403,
        data: { message: lang("Name not specified") },
        res: res,
      });
    }
    if (!project) {
      Respond({
        status: 403,
        data: { message: lang("Project not specified") },
        res: res,
      });
    }
    const can = await perms.can(req, res, "createRole", undefined, project);
    if (can.result) {
      const roles = dbUsers.model("role");
      const projModel = dbUsers.model("project");
      const data = {
        name: name,
        project: project,
        owner: can.data._id,
        can: {},
      };

      for (let n in schemas.rolePermissionFields) {
        data.can[n] =
          typeof req.body[n] !== "undefined"
            ? req.body[n] === "true"
            : schemas.rolePermissionFields[n];
      }

      roles.create(data, function (err, newRole) {
        projModel.findById(project, function (err, data) {
          data.roles = data.roles || [];
          data.roles.push(newRole._id);
          data.save(function () {
            Respond({
              status: newRole ? 200 : 400,
              data: newRole ? newRole : err,
              res: res,
            });
          });
        });
      });
    } else {
      Respond({
        status: 403,
        data: { code: "noPermissionToCreateRole" },
        res: res,
      });
    }
  },
  removeUserFromRole: async (req, res) => {
    /*  removing may happen for userRegister or tempInvitation  */

    const id = (req.body.id || "").trim(); // id of user or invitation
    const type = (req.body.type || "").trim();

    if (!id || !type) {
      Respond({
        status: 400,
        data: { message: (!id ? "id" : "type") + " not specified" },
        res: res,
      });
      return;
    }

    const currProject = GetProject(req);
    const currProjectData = await dbUsers
      .model("project")
      .findById(currProject)
      .exec();
    if (!currProjectData) {
      Respond({
        status: 400,
        data: { message: "Project not found" },
        res: res,
      });
      return;
    }
    const can = await perms.can(req, res, "modifyRole", undefined, currProject);
    if (can.result) {
      const usersModel = dbUsers.model("userRegister");
      const tempInvitation = dbUsers.model("tempInvitation");
      const role = dbUsers.model("role");
      const project = dbUsers.model("project");

      const roleData = await role.findById(req.params.role_id).exec();
      const projectData = await project.findById(roleData.project).exec();

      if (type === "user") {
        roleData.users.splice(roleData.users.indexOf(id, 1));
        projectData.users.splice(projectData.users.indexOf(id, 1));
        const userData = await usersModel.findById(id).exec();
        userData.roles.splice(userData.roles.indexOf(id, 1));
        await roleData.save();
        await projectData.save();
        await userData.save();
      } else if (type === "invitation") {
        roleData.invitations.splice(roleData.invitations.indexOf(id, 1));
        await roleData.save();
        const tempInvitationData = await tempInvitation.findById(id).exec();
        await tempInvitationData.remove();
      }
      Respond({
        status: 200,
        data: { message: "User removed" },
        res: res,
      });
    }
  },
  addUserToRole: async (req, res) => {
    const currProject = GetProject(req);
    const currProjectData = await dbUsers
      .model("project")
      .findById(currProject)
      .exec();
    if (!currProjectData) {
      Respond({
        status: 400,
        data: { message: "Project not found" },
        res: res,
      });
      return;
    }
    const can = await perms.can(req, res, "modifyRole", undefined, currProject);
    if (can.result) {
      const email = req.body.email;
      const valid = appTools.tool.validateEmail(email);
      if (!valid) {
        Respond({
          status: 400,
          data: { message: "Invalid email" },
          res: res,
        });
        return;
      }
      const usersModel = dbUsers.model("userRegister");
      const role = dbUsers.model("role");

      role.findById(req.params.role_id, async function (err, roledata) {
        if (!roledata) {
          Respond({
            status: 404,
            data: { code: "roleDoesNotExists", err: err, r: roledata },
            res: res,
          });
          return;
        }
        usersModel.findOne({ email: email }, async function (err, data) {
          const addUser = async function (data) {
            //console.log(data)
            if (currProjectData.users.indexOf(data._id) !== -1) {
              /*
                                remove user from previous role and add to new
                                which is bad idea because user with no permissions
                                can add himself to another role with permission
                                if he has role management access but no access to files:


                            */
              /*
                            const record = await role
                                .findOne({users: { "$in" : [data._id]}})
                                .where('_id')
                                .in(currProjectData.roles).exec();
                            record.users = [...record.users].splice(record.users.indexOf(data._id), 1);
                            await record.save();*/
              Respond({
                res: res,
                status: 400,
                data: { message: "Account already added to project" },
              });
              return;
            }

            if (data.type === "user") {
              roledata.users = roledata.users || [];
              roledata.users = appTools.tool.pushUnique(
                roledata.users,
                data._id
              );

              data.projects = data.projects || [];
              data.projects = appTools.tool.pushUnique(
                data.projects,
                currProject
              );

              data.roles = data.roles || [];
              data.roles = appTools.tool.pushUnique(data.roles, roledata._id);

              currProjectData.users = appTools.tool.pushUnique(
                currProjectData.users,
                data._id
              );
            } else if (data.type === "invitation") {
              roledata.invitations = roledata.invitations || [];
              roledata.invitations = appTools.tool.pushUnique(
                roledata.invitations,
                data._id
              );
            }

            await data.save();
            await currProjectData.save();
            await roledata.save();
            const html = emailTemplates.projectRoleInvite("/", currProjectData);
            await appTools.tool.sendMail({
              to: email,
              subject:
                config.site.shortName + " invitation for project collaboration",
              content: html,
              onSuccess: function () {
                Respond({
                  res: res,
                  status: 200,
                  data: { message: "success" },
                });
              },
              onError: function (error) {
                Respond({
                  res: res,
                  status: 400,
                  data: { message: error },
                });
              },
            });

            eventEmitter.emit("existingUserAddedToRole", "/", email);
          };

          if (!err && !data) {
            // user does not exists
            const tempInvitation = dbUsers.model("tempInvitation");
            var prj = GetProject(req);
            const added = await tempInvitation
              .findOne({ email: email, project: prj })
              .exec();
            if (added && added._id) {
              Respond({
                res: res,
                status: 400,
                data: { code: "emailInvitationExistsInProject" },
              });
              return;
            }
            var inviteData = {
              author: can.data._id,
              role: req.params.role_id,
              email: email,
              project: prj,
            };
            tempInvitation.create(inviteData, function (err, inv) {
              var html = emailTemplates.projectRoleInvite(inv, currProjectData);
              appTools.tool.sendMail({
                to: email,
                subject:
                  config.site.shortName +
                  " invitation for project collaboration",
                content: html,
                onSuccess: function () {
                  addUser(inv);
                  /*Respond({
                                        res:res,
                                        status:200,
                                        data:{message:'success'}
                                    });*/
                },
                onError: function (error) {
                  Respond({
                    res: res,
                    status: 400,
                    data: { message: error },
                  });
                },
              });
              eventEmitter.emit("nonExistingUserAddedToRole", inv, email);
            });
          } else if (data) {
            addUser(data);
          } else if (err) {
            Respond({
              status: 400,
              data: { message: err },
              res: res,
            });
          }
        });
      });
    }
  },
};
