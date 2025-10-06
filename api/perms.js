var userFunctions = require("./userFunctions");
var user = new userFunctions();
var db = require("./db");
const mongoose = require("mongoose");
var dbUsers = db.users();

const accessGroupsHasUserId = (accessGroups, userId) => {
  let can = false;
  if (accessGroups && userId) {
    accessGroups.forEach((group) => {
      if (ArrayContainsId(group.users, userId)) {
        can = true;
      }
    });
  }

  return can;
};

const getObject = async (objectIdOrData, model) => {
  if (
    typeof objectIdOrData === "object" &&
    objectIdOrData._id === objectIdOrData
  ) {
    objectIdOrData = "" + objectIdOrData;
  }

  const accessGroup = dbUsers.model("accessGroup");
  return new Promise(async (resolve) => {
    if (typeof objectIdOrData === "object") {
      // mongoose obj
      resolve(objectIdOrData);
    }
    if (objectIdOrData === "_home_") {
      resolve(undefined);
      return;
    }
    if (
      typeof objectIdOrData === "number" ||
      typeof objectIdOrData === "string"
    ) {
      if (!mongoose.isValidObjectId(objectIdOrData)) {
        resolve(undefined);
        return;
      }
      const obj = model
        .findById(objectIdOrData)
        .populate("accessGroups", undefined, accessGroup)
        .exec();
      resolve(obj);
    } else {
      resolve(objectIdOrData);
    }
  });
};

const responds = {
  previewObject: function (res) {
    return Respond({
      status: 403,
      data: {
        message: lang("You don't have permissions to access this object"),
      },
      res: res,
    });
  },
  modifyObject: function (res) {
    return Respond({
      status: 403,
      data: {
        message: lang("You don't have permissions to modify this object"),
      },
      res: res,
    });
  },
};

const core = {
  isPublicObject: function (action, object) {
    return action === "previewObject" && object && object.public === true;
  },
  objectData: async function (action, object) {},
  getObjectData: async (id, projectId) => {
    return new Promise(async (resolve) => {
      if (!id) {
        resolve(null);
      } else if (typeof id === "number" || typeof id === "string" || !id._id) {
        const object = (await db.appConnect(projectId)).model("object");
        const accessGroup = dbUsers.model("accessGroup");
        object
          .findById(id)
          .populate("accessGroups", undefined, accessGroup)
          .exec(function (err, data) {
            if (data) {
              resolve(data);
            } else {
              resolve(null);
            }
          });
      } else {
        resolve(id);
      }
    });
  },
  getProject: async (id) => {
    return new Promise((resolve) => {
      if (!id) {
        resolve(null);
        console.log("Project id not specified");
        return;
      }
      if (typeof id === "number" || typeof id === "string" || !id._id) {
        const projectModel = dbUsers.model("project");
        projectModel
          .findById(id)
          .populate({
            path: "roles",
          })
          .exec(function (err, data) {
            if (data) {
              resolve(data);
            } else {
              resolve(null);
            }
          });
      } else {
        resolve(id);
      }
    });
  },
  getProjectUsers: async (projectIdOrObject) => {
    if (projectIdOrObject) {
      projectIdOrObject = await (await db.appConnect(req))
        .model("object")
        .findById(projectIdOrObject);
    }
    if (!projectIdOrObject) {
      return false;
    }
    return projectIdOrObject.users;
  },
};

// each should be async
const perm = {
  _accessProject: async (projectID, user) => {
    return new Promise(async (resolve) => {
      if (projectID) {
        const project = await core.getProject(projectID);
        project.users = project.users || [];
        if (project.owner == user._id || project.creator == user._id) {
          resolve(true);
          return;
        } else {
          for (let i = 0; i < project.users.length; i++) {
            if (project.users[i] == user._id) {
              resolve(true);
              return;
            }
          }
          resolve(false);
        }
      } else {
        resolve(false);
        return;
      }
    });
  },
  $accessProject: async (projectID, user, data) => {
    const userid = user._id ? user._id : user;

    return new Promise(async (resolve) => {
      if (projectID) {
        const project = await core.getProject(projectID);

        if (!project) {
          resolve({
            result: false,
            data: project,
          });
          return;
        }

        project.users = project.users || [];
        if (
          EqualIds(project.owner, userid) ||
          EqualIds(project.creator, userid)
        ) {
          resolve({
            result: true,
            data: user,
          });
          return;
        } else {
          for (let i = 0; i < project.users.length; i++) {
            if (EqualIds(project.users[i], user._id)) {
              resolve({
                data: user,
                result: true,
              });
              return;
            }
          }

          if (ArrayContainsId(project.users, user._id)) {
            resolve({
              result: true,
              data: user,
            });
            return;
          }

          resolve({
            result: false,
            data: user,
          });
        }
      } else {
        resolve({
          result: false,
          data: user,
        });
      }
    });
  },
  $manageProject: async (projectID, user) => {
    // name, description, image ...
    const userid = user._id ? user._id : user;
    return new Promise(async (resolve) => {
      if (projectID) {
        const project = await core.getProject(projectID);
        project.users = project.users || [];
        if (
          EqualIds(project.owner, userid) ||
          EqualIds(project.creator, userid)
        ) {
          resolve({
            result: true,
            data: user,
          });
          return;
        } else {
          resolve({
            result: false,
            data: user,
          });
        }
      } else {
        resolve({
          result: false,
          data: user,
        });
      }
    });
  },
  $createProject: function (user) {
    return new Promise(async (resolve) => {
      const now = new Date();
      const res =
        !!user.payment &&
        user.payment.validUntil &&
        new Date(user.payment.validUntil).getTime() > now.getTime();
      resolve({
        result: res,
        data: user,
      });
    });
  },
  createRole: async (projectID, user) => {
    const project = await core.getProject(projectID);
    return new Promise(async (resolve) => {
      if (!project) {
        resolve({
          result: false,
          data: user,
        });
      } else {
        if (
          EqualIds(project.creator, user._id) ||
          EqualIds(project.owner, user._id)
        ) {
          resolve({
            result: true,
            data: user,
          });
        } else {
          for (let i = 0; i < project.roles.length; i++) {
            if (
              project.roles[i].can.createRole &&
              ArrayContainsId(project.roles[i].users, user._id)
            ) {
              resolve({
                result: true,
                data: user,
              });
              return;
            }
          }
          resolve({
            result: false,
            data: user,
          });
        }
      }
    });
  },
  modifyRole: async (projectID, user) => {
    const project = await core.getProject(projectID);
    return new Promise(async (resolve) => {
      if (!project) {
        resolve({
          result: false,
          data: user,
        });
      } else {
        if (
          EqualIds(project.creator, user._id) ||
          EqualIds(project.owner, user._id)
        ) {
          resolve({
            result: true,
            data: user,
          });
        } else {
          for (let i = 0; i < project.roles.length; i++) {
            if (
              project.roles[i].can.modifyRole &&
              ArrayContainsId(project.roles[i].users, user._id)
            ) {
              resolve({
                result: true,
                data: user,
              });
              return;
            }
          }
          resolve({
            result: false,
            data: user,
          });
        }
      }
    });
  },
  deleteRole: async (projectID, user) => {
    const project = await core.getProject(projectID);
    return new Promise(async (resolve) => {
      if (!project) {
        resolve({
          result: false,
          data: user,
        });
      } else {
        if (
          EqualIds(project.creator, user._id) ||
          EqualIds(project.owner === user._id)
        ) {
          resolve({
            result: true,
            data: user,
          });
        } else {
          for (let i = 0; i < project.roles.length; i++) {
            if (
              project.roles[i].can.deleteRole &&
              project.roles[i].users.indexOf(user._id) !== -1
            ) {
              resolve({
                result: true,
                data: user,
              });
              return;
            }
          }
          resolve({
            result: false,
            data: user,
          });
        }
      }
    });
  },
  previewObject: async (projectID, user, objectIdOrDataOrprojectID) => {
    const scope = this;

    const obj = await getObject(
      objectIdOrDataOrprojectID,
      await db.getAppModel(projectID, "object")
    );

    const project = await core.getProject(projectID);
    return new Promise(async (resolve) => {
      if (!obj) {
        resolve({ result: false, data: user, code: "notFound" });

        return;
      }
      if (!project) {
        resolve({ result: false, data: user, code: "projectNotSpecified" });

        return;
      }
      if (
        EqualIds(project.creator, user._id) ||
        EqualIds(project.owner, user._id) /*|| EqualIds(obj.author, user._id)*/
      ) {
        resolve({ result: true, data: user });
        return;
      }
      let canByRole = false;
      if (obj.type === "file") {
        // previewObject
        for (let i = 0; i < project.roles.length; i++) {
          if (
            project.roles[i].can.previewObject &&
            project.roles[i].users.indexOf(user._id) !== -1
          ) {
            canByRole = true;
          }
        }
        if (!canByRole) {
          resolve({
            result: false,
            data: user,
          });
          return;
        }
      }

      if (
        (obj.users && obj.users.length) ||
        (obj.accessGroups && obj.accessGroups.length)
      ) {
        let byGroup = false;
        if (obj.accessGroups) {
          obj.accessGroups.forEach((group) => {
            if (ArrayContainsId(group.users, user._id)) {
              byGroup = true;
            }
          });
        }
        resolve({
          result:
            EqualIds(obj.author, user._id) ||
            ArrayContainsId(obj.users, user._id) ||
            byGroup,
          data: user,
        });
        return;
      }

      if (ArrayContainsId(project.users, user._id)) {
        if (obj.folder) {
          const rs2 = await perm.previewObject(projectID, user, obj.folder);
          resolve(rs2);
        } else {
          resolve({ result: true, data: user });
        }
      } else {
        resolve({ result: false, data: user });
      }
    });
  },
  previewObjectIfPublic: async (projectID, user, objectIdOrDataOrprojectID) => {
    return new Promise(async (resolve) => {
      if (!objectIdOrDataOrprojectID) {
        resolve({
          result: false,
          data: {},
        });
        return;
      }
      const obj = await getObject(
        objectIdOrDataOrprojectID,
        await db.getAppModel(projectID, "object")
      );
      resolve({
        result: obj && obj.public,
        data: obj,
      });
    });
  },
  createObject: async (projectID, user, objectIdOrDataOrprojectID) => {
    let folder = objectIdOrDataOrprojectID || null;
    const project = await core.getProject(projectID);
    folder = await core.getObjectData(folder, projectID);

    return new Promise(async (resolve) => {
      if (!project) {
        resolve({ result: false, data: user });
      } else {
        if (
          EqualIds(project.creator, user._id) ||
          EqualIds(project.owner, user._id)
        ) {
          resolve({ result: true, data: user });
        } else {
          for (let i = 0; i < project.roles.length; i++) {
            if (
              project.roles[i].can.createObject &&
              ArrayContainsId(project.roles[i].users, user._id)
            ) {
              if (
                !folder ||
                EqualIds(folder.author, user._id) ||
                ((!folder.users || folder.users.length === 0) &&
                  (!folder.accessGroups || folder.accessGroups.length === 0)) ||
                ArrayContainsId(folder.users, user._id) ||
                accessGroupsHasUserId(folder.accessGroups, user._id)
              ) {
                resolve({ result: true, data: user });
              } else {
                resolve({ result: false, data: user });
              }

              return;
            }
          }
          resolve({ result: false, data: user });
        }
      }
    });
  },
  deleteObject: async (projectID, user) => {
    const project = await core.getProject(projectID);
    return new Promise(async (resolve) => {
      if (!project) {
        resolve({
          result: false,
          data: user,
        });
      } else {
        if (
          EqualIds(project.creator, user._id) ||
          EqualIds(project.owner, user._id)
        ) {
          resolve({
            result: true,
            data: user,
          });
        } else {
          for (let i = 0; i < project.roles.length; i++) {
            if (
              project.roles[i].can.deleteObject &&
              project.roles[i].users.indexOf(user._id) !== -1
            ) {
              resolve({
                result: true,
                data: user,
              });
              return;
            }
          }
          resolve({
            result: false,
            data: user,
          });
        }
      }
    });
  },
  modifyObject: async (projectID, user, objectOrID) => {
    const project = await core.getProject(projectID);
    return new Promise(async (resolve) => {
      if (!project) {
        resolve({
          result: false,
          data: user,
        });
      } else {
        if (
          EqualIds(project.creator, user._id) ||
          EqualIds(project.owner, user._id)
        ) {
          resolve({
            result: true,
            data: user,
          });
        } else {
          for (let i = 0; i < project.roles.length; i++) {
            if (
              project.roles[i].can.modifyObject &&
              ArrayContainsId(project.roles[i].users, user._id)
            ) {
              resolve({
                result: true,
                data: user,
              });
              return;
            }
            if (
              project.roles[i].can.createObject &&
              ArrayContainsId(project.roles[i].users, user._id)
            ) {
              resolve({
                result: true,
                data: user,
              });
              return;
            }
          }
          resolve({
            result: false,
            data: user,
          });
        }
      }
    });
  },
  canComment: async (projectID, user, objectIdOrDataOrprojectID) => {
    const project = await core.getProject(projectID);
    return new Promise(async (resolve) => {
      if (!project) {
        resolve({
          result: false,
          data: user,
        });
      } else {
        if (
          EqualIds(project.creator, user._id) ||
          EqualIds(project.owner, user._id)
        ) {
          resolve({
            result: true,
            data: user,
          });
        } else {
          for (let i = 0; i < project.roles.length; i++) {
            if (
              project.roles[i].can.canComment &&
              ArrayContainsId(project.roles[i].users, user._id)
            ) {
              resolve({
                result: true,
                data: user,
              });
              return;
            }
          }
          resolve({
            result: false,
            data: user,
          });
        }
      }
    });
  },
  monitorActivity: async (projectID, user) => {
    const project = await core.getProject(projectID);

    return new Promise(async (resolve) => {
      if (!project) {
        resolve({
          result: false,
          data: user,
        });
      } else {
        if (
          EqualIds(project.creator, user._id) ||
          EqualIds(project.owner, user._id)
        ) {
          resolve({
            result: true,
            data: user,
          });
        } else {
          for (let i = 0; i < project.roles.length; i++) {
            if (
              project.roles[i].can.monitorActivity &&
              ArrayContainsId(project.roles[i].users, user._id)
            ) {
              resolve({
                result: true,
                data: user,
              });
              return;
            }
            if (
              project.roles[i].can.monitorActivity &&
              ArrayContainsId(project.roles[i].users, user._id)
            ) {
              resolve({
                result: true,
                data: user,
              });
              return;
            }
          }
          resolve({
            result: false,
            data: user,
          });
        }
      }
    });
  },
};

module.exports = {
  perm: perm,

  /* action: String

        $accessProject
        $createProject

        $isLogged

        obsolate - addUser
        obsolate - removeUser

        createObject
        deleteObject
        modifyObject

        obsolate - previewObject

        createRole
        deleteRole
        modifyRole

        canComment

*/

  // returns { result, data}
  _alwaysCan: false,
  can: async function (
    req,
    res,
    action,
    objectIdOrDataOrprojectID,
    projectID,
    select
  ) {
    projectID = projectID || GetProject(req);

    const scope = this;

    return new Promise(async (resolve) => {
      if (
        action === "previewObject" &&
        objectIdOrDataOrprojectID !== "_home_"
      ) {
        const objId = objectIdOrDataOrprojectID || req.params.id || req.body.id;

        const res = await perm.previewObjectIfPublic(projectID, user, objId);
        if (res.result) {
          resolve({
            data: {},
            result: res.result,
          });
          return;
        } else {
        }
      }

      user.validateProfile(
        req,
        res,
        async function (req, res, userData) {
          const data = {
            data: userData,
            result: !!userData,
          };
          if (scope._alwaysCan) {
            resolve(data);
            return;
          }

          if (!data.result || action === "$isLogged") {
            resolve(data);
            return;
          }

          if (!projectID) {
            if (action !== "$createProject") {
              Respond({
                status: 400,
                data: {
                  code: "projectNotSpecified",
                },
                res: res,
              });
              resolve({
                data: {},
                result: false,
              });

              return;
            }
          }

          if (
            action === "previewObject" &&
            objectIdOrDataOrprojectID &&
            objectIdOrDataOrprojectID === "_home_"
          ) {
            action = "$accessProject";
          }

          let can;

          if (action === "$accessProject") {
            can = await perm.$accessProject(
              projectID || objectIdOrDataOrprojectID,
              userData,
              data
            );
          } else if (action === "$manageProject") {
            can = await perm.$manageProject(projectID, userData);
          } else if (action === "$createProject") {
            can = await perm.$createProject(userData);
          } else if (action === "createRole") {
            can = await perm.createRole(projectID, userData);
          } else if (action === "modifyRole") {
            can = await perm.modifyRole(projectID, userData);
          } else if (action === "deleteRole") {
            can = await perm.deleteRole(projectID, userData);
          } else if (action === "createObject") {
            can = await perm.createObject(
              projectID,
              userData,
              objectIdOrDataOrprojectID
            );
          } else if (action === "previewObject") {
            can = await perm.previewObject(
              projectID,
              userData,
              objectIdOrDataOrprojectID
            );
          } else if (action === "modifyObject") {
            can = await perm.modifyObject(
              projectID,
              userData,
              objectIdOrDataOrprojectID
            );
          } else if (action === "deleteObject") {
            can = await perm.deleteObject(
              projectID,
              userData,
              objectIdOrDataOrprojectID
            );
          } else if (action === "canComment") {
            can = await perm.canComment(
              projectID,
              userData,
              objectIdOrDataOrprojectID
            );
          } else if (action === "monitorActivity") {
            can = await perm.monitorActivity(projectID, userData);
          }

          resolve(can);
        },
        select
      );
    });
  },
};
