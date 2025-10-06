var mongoose = require("mongoose");
var db = require("./db");

var dbUsers = db.users();
var Schema = mongoose.Schema;
var schemas = require("./schemas");
schemas = new schemas();
var express = require("express");
var tools = require("./tools");

eventEmitter = require("./events");

var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;

var emailTemplates = require("./emails");
var config = require("./config");

schemas.configRecords();
schemas.userRegister();
schemas.project();
schemas.comment();
schemas.plugin();

const pencryption = config.encryption;

var moment = require("moment");

var views = __dirname + "/views";
var profile = __dirname + "/views/profile";

const __interceptor = async (name) => {
  if (config.interceptors && typeof config.interceptors[name] === "function") {
    return await config.interceptors[name];
  }
  return false;
};

module.exports = function () {
  return {
    validatePassWord: async (req, pass, user = null) => {
      return new Promise(async (resolve) => {
        // pass = await pencryption(pass || req.body.password);
        var users = dbUsers.model("userRegister");

        if (user && user.password) {
          console.log(
            "asasas",
            await config.encryptionCompare(pass, user.password)
          );
          resolve(await config.encryptionCompare(pass, user.password));
          return;
        }

        var token = appTools.tool.getToken(req);

        user = await users
          .findOne({
            token,
          })
          .select("+password")
          .exec();

        resolve(
          !!user && (await config.encryptionCompare(pass, user.password))
        );
      });
    },

    login: function (req, res) {
      var errdata = [],
        validMail = true;
      if (appTools.tool.validateEmail(req.body.email) === false) {
        validMail = false;
        errdata.push({
          code: "invalidEmail",
          path: "email",
        });
      }
      if (!req.body.password) {
        errdata.push({
          code: "noPassword",
          path: "password",
        });
      }
      if (validMail === false || !req.body.password) {
        Respond({
          res: res,
          data: errdata,
          status: 422,
        });
        return false;
      }
      passport.authenticate("local", function (data) {
        if (data === null) {
          Respond({
            res: res,
            data: [{ code: "incorrectEmailOrPassword", path: "password" }],
            status: 401,
          });
        } else if (!!data.token) {
          eventEmitter.emit("userLogIn", data);
          Respond({
            res: res,
            data: data,
            status: 200,
          });
        }
      })(req, res);
    },
    sendConfirmationEmail: async function (req, res, newUser) {
      if (newUser.confirmed) {
        Respond({
          res: res,
          status: 200,
          data: { code: "profileConfirmed", path: "confirmed" },
        });
        return false;
      }
      var confirmRegistrationEmail = emailTemplates.confirmRegistration(
        config.uiDomain + "/profile?token=" + newUser.token,
        {
          req,
          res,
          user: newUser,
        }
      );

      let content = await __interceptor("sendConfirmationEmailContent", {
        req,
        res,
        user: newUser,
        lang: req.query.lang || "en",
        newUser,
      });

      if (!content) {
        content = confirmRegistrationEmail.html;
      }

      let subject = await __interceptor("sendConfirmationEmailSubject", {
        req,
        res,
        user: newUser,
        lang: req.query.lang || "en",
        newUser,
      });

      if (!subject) {
        subject = confirmRegistrationEmail.subject;
      }

      appTools.tool.sendMail({
        to: newUser.email,
        subject: subject,
        content: content,
        onSuccess: function () {
          Respond({
            res: res,
            status: 200,
            data: {
              token: newUser.token,
              confirmed: newUser.confirmed,
            },
          });
        },
        onError: function (error) {
          if (typeof error === "string" && error.indexOf("") !== -1) {
            var data = [
              {
                message: "Email does not exists. Please enter valid email.",
                path: "email",
              },
            ];
          } else {
            var data = { message: error };
          }
          Respond({
            res: res,
            status: 400,
            data: data,
          });
        },
      });
    },
    updateprofile: function (req, res) {
      this.validateProfile(
        req,
        res,
        async function (req, res, userData) {
          /*        var usersModel = dbUsers.model('userRegister');
        userData = await usersModel.findById(userData._id)*/
          var type = req.body.type;
          var customFields = req.body.customFields;
          if (type === "info") {
            var fName = (req.body.firstName || "").trim();
            var lName = (req.body.lastName || "").trim();
            if (fName) userData.firstName = fName;
            if (lName) userData.lastName = lName;
            if (!!req.files && !!req.files[0] && req.files[0].size < 300000) {
              userData.image = await appTools.tool.saveFile(
                req.files[0].buffer,
                userData.image
              );
            } else if (req.body.image === "delete") {
              await appTools.tool.removeFile(userData.image);
              userData.image = null;
            }

            if (customFields) {
              userData.customFields = Object.assign(
                {},
                userData.customFields || {},
                customFields
              );
            }

            // userData.starredObjects = null;

            userData.save(function (nerr, ndata) {
              Respond({
                res: res,
                data: { ok: true },
                status: 200,
              });
            });
          } else if (type === "password2") {
            const currPass = (req.body.currentPassword || "").trim();
            const pass1 = (req.body.password1 || "").trim();
            const pass2 = (req.body.password2 || "").trim();

            if (!currPass) {
              Respond({
                status: 403,
                data: {
                  message: "Current password is not defined",
                  path: "currentPassword",
                  code: "currPassUndefined",
                },
                res: res,
              });
              return;
            }

            if (
              !(await config.encryptionCompare(currPass, userData.password))
            ) {
              Respond({
                status: 403,
                data: {
                  message: "Wrong password",
                  path: "currentPassword",
                  code: "wrongCurrentPassword",
                },
                res: res,
              });
              return;
            }

            if (!pass1) {
              Respond({
                status: 403,
                data: { message: "Password not defined", path: "password1" },
                res: res,
              });
              return;
            }
            if (!pass2) {
              Respond({
                status: 403,
                data: { message: "Password 2 not defined", path: "password2" },
                res: res,
              });
              return;
            }
            if (pass1 !== pass2) {
              Respond({
                status: 403,
                data: { message: "Passwords do not match", path: "password2" },
                res: res,
              });
              return;
            }

            userData.password = await pencryption(pass1);

            userData.save(function (nerr, ndata) {
              Respond({
                res: res,
                data: { message: "Password updated" },
                status: 200,
              });
            });
          } else if (type === "password") {
            const pass1 = (req.body.password1 || "").trim();
            const pass2 = (req.body.password2 || "").trim();
            if (!pass1) {
              Respond({
                status: 403,
                data: { message: "Password not defined", path: "password1" },
                res: res,
              });
              return;
            }
            if (!pass2) {
              Respond({
                status: 403,
                data: { message: "Password not defined", path: "password2" },
                res: res,
              });
              return;
            }
            if (pass1 !== pass2) {
              Respond({
                status: 403,
                data: { message: "Passwords do not match", path: "password2" },
                res: res,
              });
              return;
            }

            userData.password = await pencryption(pass1);

            userData.save(function (nerr, ndata) {
              Respond({
                res: res,
                data: { message: "Password updated" },
                status: 200,
              });
            });
          }
        },
        "+password"
      );
    },
    order: function (userID, orderContent) {
      var orders = dbUsers.model("order");
      var data = {
        content: orderContent,
        author: userID,
        meta: "",
      };
      return new Promise((resolve) => {
        orders.create(data, function (err, newOrder) {
          if (!err) {
            resolve(newOrder);
          } else {
            resolve(err);
          }
        });
      });
    },
    register: async function (req, res) {
      var scope = this;
      var errdata = [],
        validMail = true;
      if (appTools.tool.validateEmail(req.body.email) === false) {
        validMail = false;
        errdata.push({
          message: "Please enter valid email.",
          path: "email",
        });
      }
      if (!req.body.password) {
        errdata.push({
          message: "Please enter password.",
          path: "password",
        });
      }
      if (!!req.body.password && req.body.password.length < 4) {
        errdata.push({
          message: "Password must be at least 4 symbols.",
          path: "password",
        });
      }

      if (errdata.length) {
        Respond({
          res: res,
          data: errdata,
          status: 422,
        });
        return false;
      }
      var user = {
        email: req.body.email,
        password: await config.encryption(req.body.password),
        token: appTools.tool.createPrivateToken(),
        publicToken: appTools.tool.createToken(),
        constToken: appTools.tool.createToken(),
        confirmed: !config.requireProfileConfirmation,
      };
      if (req.body.name != "") {
        user.name = req.body.name;
      }
      var users = dbUsers.model("userRegister");

      users.find({ email: req.body.email }, function (err, data) {
        if (data) {
          if (data.length === 0) {
            users.create(user, async function (err, newUser) {
              await scope.sendConfirmationEmail(req, res, newUser);
              eventEmitter.emit("userHaveRegistered", newUser);
            });
          } else {
            Respond({
              res: res,
              data: { message: "This email is already in use.", path: "email" },
              status: 422,
            });
          }
        } else {
          Respond({
            res: res,
            data: err,
            status: 403,
          });
        }
      });
    },
    isAuthorOf: async function (data, callback) {
      this.validateProfile(
        data.req,
        data.res,
        async function (req, res, userData) {
          var postType = data.type || "comment";
          var POSTS = await db.getAppModel(data.req, postType);
          var id = data.id || data.body.id;
          POSTS.findById(id, function (err, POSTdata) {
            if (err) {
              Respond({
                status: 404,
                data: { message: "Comment not found." },
                res: res,
              });
            } else {
              if (POSTdata.author == userData.id) {
                callback.call();
              } else {
                Respond({
                  status: 400,
                  data: { message: "That's not yours." },
                  res: res,
                });
              }
            }
          });
        }
      );
    },
    validateProfileAsync: async function (req, select = "+payment") {
      return new Promise(async (resolve) => {
        var token = appTools.tool.getToken(req);
        if (!token) {
          resolve(false);
          return;
        }

        const usr = await dbUsers
          .model("userRegister")
          .findOne({ token: token })
          .select(select)
          .exec();

        if (!usr) {
          resolve(false);
        } else {
          resolve(
            usr.confirmed === true || !config.requireProfileConfirmation
              ? usr
              : false
          );
        }
      });
    },
    validateProfile: function (req, res, callback, select = "+payment") {
      if (select.indexOf("+payment") === -1) {
        select += " +payment";
      }
      var token = appTools.tool.getToken(req);

      if (!token) {
        Respond({
          status: 403,
          data: {
            code: "notAuthorized",
            showMessage: false,
            command: "redirectToLogin",
          },
          res: res,
        });
        return;
      }

      var users = dbUsers.model("userRegister");
      users
        .findOne({ token: token })
        .select(select)
        .exec(async function (err, data) {
          if (data != null) {
            if (data.confirmed === true || !config.requireProfileConfirmation) {
              callback.call(undefined, req, res, data);
            } else {
              Respond({
                status: 401,
                data: {
                  message: "Profile not confirmed.",
                  code: "profileNotConfirmed",
                },
                res: res,
              });
            }
          } else {
            Respond({
              status: 403,
              data: { code: "notAuthorized", showMessage: false },
              res: res,
            });
          }
        });
    },
    profile: function (req, res) {
      var scope = this;
      var token = appTools.tool.getToken(req),
        users = dbUsers.model("userRegister");
      if (!token) {
        Respond({
          status: 403,
          data: {
            message: "Not authorized.",
            showMessage: false,
            logged: false,
          },
          res: res,
        });
        return;
      }
      //users.find({ email:'alexander.raikov@gmail.com' }).remove().exec();
      users
        .findOne({ token: token })
        .select("+email")
        .exec(function (err, data) {
          if (data != null) {
            var final = { logged: true, token: token };
            if (data.confirmed == true) {
              final.email = data.email;
              final.token = data.token;
              final.firstName = data.firstName;
              final.lastName = data.lastName;
              final.displayName = data.firstName + " " + data.lastName;
              final.confirmed = data.confirmed;
              final.meta = data.meta;
              final.can = data.can;
              final._id = data._id;
            } else {
              final.confirmed = data.confirmed;
              final.token = data.token;
            }
            Respond({
              status: 200,
              data: final,
              res: res,
            });
          } else {
            Respond({
              status: 403,
              data: {
                message: "Not authorized.",
                showMessage: false,
                logged: false,
              },
              res: res,
            });
          }
        });
    },
    resendConfirm: function (req, res) {
      var scope = this;
      var token = appTools.tool.getToken(req);
      var users = dbUsers.model("userRegister");
      users.findOne({ token: token }, function (err, data) {
        if (data != null) {
          if (data.confirmed == false) {
            scope.confirm(req, res);
          }
        }
      });
    },
    sendResetLink: function (req, res) {
      var users = dbUsers.model("userRegister");
      var token = appTools.tool.getToken(req);
      users
        .findOne({ email: req.body.email })
        .select("+token +email")
        .exec(async function (err, data) {
          if (data) {
            const link =
              config.uiDomain + (req.body.route || "/restore-password");
            var passwordReset = emailTemplates.passwordReset(
              link + "?token=" + data.token,
              {
                req,
                res,
              }
            );

            const subject =
              (await __interceptor("passwordResetRequestSubject", {
                req,
                res,
                lang: req.query.lang,
              })) || passwordReset.subject;
            const content =
              (await __interceptor("passwordResetRequestContent", {
                req,
                res,
                lang: req.query.lang,
              })) || passwordReset.html;
            __interceptor("passwordResetRequest.content");

            appTools.tool.sendMail({
              to: data.email,
              subject: subject,
              content: content,
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
          } else {
            Respond({
              res: res,
              status: 422,
              data: { message: "Email not found." },
            });
          }
        });
    },
    restorePassword: async function (req, res) {
      if (!!req.query.token) {
        var users = dbUsers.model("userRegister");
        var token = appTools.tool.createToken();

        if (!req.body.password) {
          Respond({
            status: 400,
            data: [
              {
                message: "Please enter password",
                path: "password",
              },
            ],
            res,
          });
          return;
        }
        if (!req.body.password2) {
          Respond({
            status: 400,
            data: [
              {
                message: "Please confirm the password",
                path: "password2",
              },
            ],
            res,
          });
          return;
        }
        if (req.body.password !== req.body.password2) {
          Respond({
            status: 400,
            data: [
              {
                message: "Passwords does not match",
                path: "password2",
              },
            ],
            res,
          });
          return;
        }

        users.findOneAndUpdate(
          { token: req.query.token.trim() },
          {
            token: token,
            password: await pencryption(req.body.password.trim()),
          },
          undefined,
          function (err, data) {
            if (!!data) {
              var mail = emailTemplates.passwordRestored();
              appTools.tool.sendMail({
                to: data.email,
                subject: config.site.shortName + " Password changed",
                content: mail,
              });
              Respond({
                status: 200,
                res: res,
                message: "Password successfully changed",
              });
            } else {
              Respond({
                status: 403,
                res: res,
                message: "Token not found.",
              });
            }
          }
        );
      } else {
        Respond({
          status: 403,
          res: res,
          message: "Token not found.",
        });
      }
    },
    confirm: function (req, res) {
      if (!!req.query.token) {
        var users = dbUsers.model("userRegister");
        var token = appTools.tool.createToken();
        users.findOneAndUpdate(
          { token: req.query.token },
          { token: token, confirmed: true },
          undefined,
          function (err, data) {
            if (!!data) {
              Respond({
                status: 200,
                res: res,
                data: {
                  token: token,
                },
              });
            } else {
              Respond({
                status: 422,
                res: res,
                data: "Token not found.",
              });
            }
          }
        );
      } else {
        Respond({
          status: 422,
          res: res,
          data: "Token not found.",
        });
      }
    },
    checkToken: function (req, res) {
      if (!!req.query.token) {
        var users = dbUsers.model("userRegister");
        users.findOne({ token: req.query.token }, function (err, data) {
          if (data != null) {
            Respond({
              res: res,
              status: 200,
              data: { message: true },
            });
          } else {
            Respond({
              status: 403,
              data: { message: "Wrong or expired link." },
              res: res,
            });
          }
        });
      } else {
        Respond({
          status: 403,
          data: { message: "Wrong or expired link." },
          res: res,
        });
      }
    },

    preparePostData: function (postArray) {
      if (!postArray) return [];
      postArray = JSON.parse(JSON.stringify(postArray));
      for (var x in postArray) {
        var item = postArray[x];
        item.ago = moment(item.date).fromNow();
        delete item.__v;
        //delete item._id;
      }
      return postArray;
    },
    meta: function (current, key, value, method) {
      var jcurr = jsonstring(current);
      method = method || "set"; //increment, decrement
      if (value == "increment" || value == "decrement") {
        method = "" + value;
        value = 1;
      }

      if (!value) {
        return jcurr.item(key);
      } else {
        if (!isNaN(parseInt(jcurr.item(key), 10))) {
          if (method == "set") {
            jcurr.item(key, value);
          } else if (method == "increment") {
            jcurr.item(key, parseInt(jcurr.item(key), 10) + value);
          } else if (method == "decrement") {
            jcurr.item(key, parseInt(jcurr.item(key), 10) - value);
          }
        } else if (
          typeof jcurr.item(key) == "string" ||
          typeof jcurr.item(key) == "boolean"
        ) {
          jcurr.item(key, value);
        } else if (typeof jcurr.item(key) == "undefined") {
          jcurr.item(key, typeof value == "number" ? 0 : "");
          return this.meta(jcurr.data, key, value, method);
        }
        return jcurr.data;
      }
    },
  };
};
