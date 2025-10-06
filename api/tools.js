//var nodemailer = require('nodemailer');
//var smtpTransport = require('nodemailer-smtp-transport');
const config = require("./config");
const fs = require("fs");

const moment = require("moment-timezone");

const mongoose = require("mongoose");

const saveFile = async (file, current) => {
  return new Promise(async (resolve) => {
    let name;
    if (file) {
      name = (file.name || "") + new Date().getTime();
    }
    const folder = __dirname + appSeparator + config.staticPath + appSeparator;
    if (current && fs.existsSync(folder + current)) {
      fs.unlinkSync(folder + current);
    }
    if (file) {
      fs.writeFile(folder + name, file, async function (err) {
        resolve(name);
      });
    } else {
      resolve(null);
    }
  });
};

const deleteFile = async (current) => {
  return await saveFile(null, current);
};

const propDate = (date) => {
  date = moment(date).toDate();
  const minute = 60000;
  const dt = new Date(date);
  const off = dt.getTimezoneOffset() * minute;
  return new Date(dt.getTime() - off);
};

const getDate = function (date) {
  // return propDate(date);
  if (!date) {
    date = new Date();
  }
  return moment(date).tz(config.TZ).local().toDate();
};

module.exports = {
  useAwait: (p) => p.then((data) => [data, null]).catch((err) => [null, err]),
  saveFile,
  getDate,
  deleteFile,
  removeFile: deleteFile,
  pushUnique: function (array, value) {
    if (!array) {
      array = [];
    }
    if (array.indexOf(value) === -1) {
      array.push(value);
    }
    return [...array];
  },
  isObjectEmpty: function (obj) {
    for (var i in obj) {
      return false;
    }
    return true;
  },
  prepareUserData: function (obj) {
    if (!obj) return {};
    var final = JSON.parse(JSON.stringify(obj));
    delete final.password;
    //delete final._id;
    delete final._v;
    delete final.token;
    return final;
  },
  isValidObjectId: function (id, res) {
    const result = mongoose.isValidObjectId(id);
    if (!result && res) {
      Respond({
        res: res,
        data: { code: "notFound" },
        status: 404,
      });
    }
    return result;
  },
  toObjectId: function (str) {
    var ObjectId = mongoose.Types.ObjectId;
    return new ObjectId(str.toString());
  },
  getToken: function (req) {
    if (req.params.token) {
      return req.params.token;
    } else if (req.headers.authorization) {
      return req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
      return req.query.token;
    } else if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    } else {
      return "";
    }
  },
  createPrivateToken: function (prefix) {
    return appTools.tool.createToken("user") + appTools.tool.createToken();
  },
  createToken: function (prefix) {
    prefix = prefix || "";
    var lttrs = Math.floor(Math.random() * 900000000).toString(36);
    return (
      lttrs +
      "" +
      (new Date().getTime() + "" + Math.floor(Math.random() * 100000000))
    );
  },
  validateEmail: function (email) {
    var re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  },

  emailAdapters: {
    sendgrid: function (data, callback) {
      const sendgrid = require("@sendgrid/mail");
      sendgrid.setApiKey(config.sendgrid.api_key);
      data.from = config.sendgrid.senderFrom;

      sendgrid.send(data).then(
        (res) => {
          if (callback) {
            callback.call(undefined);
          }
        },
        (error) => {
          console.log("err1", error);
          //  console.log('err2', error.response.body);
        }
      );
    },
    mailgun: function (data, callback) {
      var mailgun = require("mailgun-js")({
        apiKey: config.mailgun.api_key,
        domain: config.uiDomain,
      });
      mailgun.messages().send(data, function (error, reply) {
        if (callback) {
          callback.call(undefined, error, reply);
        }
      });
    },
    sendmail: function (data, callback) {
      var sendmail = require("sendmail")();
      sendmail(data, function (error, reply) {
        if (callback) {
          callback.call(undefined, error, reply);
        }
      });
    },
    nodemailer: function (data, callback) {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport(config.nodemailer);
      transporter
        .sendMail(data)
        .then((info) => {
          if (callback) {
            callback.call(undefined, null, true);
          }
        })
        .catch(console.error);
    },

    noop: function (data, callback) {
      if (callback) {
        callback.call(undefined, null, true);
      }
    },
  },

  sendMail: async function (obj) {
    return new Promise((resolve) => {
      if (!!obj.onError && !obj.to) {
        var err = "Recipient not specified.";
        obj.onError.call(this, err);
      }

      var data = {
        from: '"' + config.site.shortName + ' " <' + config.mail.email + ">",
        to: obj.to,
        subject: obj.subject,
        html: obj.content,
      };

      this.emailAdapters[config.adapters.email](data, function (error, reply) {
        if (error && error.stack) {
          if (!!obj.onError) {
            obj.onError.call(this, error, reply);
          }
          resolve(false);
        } else {
          if (!!obj.onSuccess) {
            obj.onSuccess.call(this, reply);
          }
          resolve(true);
        }
      });
    });

    /*********************

        Example object:

        *********************

            {
                to:'exaple@test.com',
                subject: 'Some subject',
                content: 'HTML content',
                onSuccess:function(){

                },
                onError:function(){

                }
            }


        */
  },
  sendMail2: async function (obj) {
    const emailAdapters2 = require("./email-adapters2");

    return new Promise(async (resolve) => {
      if (!obj.to) {
        resolve({
          adapter: config.adapters.email,
          type: "error",
          ok: false,
          response: {
            code: "recipientNotSpecified",
            messages: "Recipient not specified",
          },
        });
        return;
      }

      var data = {
        from: '"' + config.site.shortName + ' " <' + config.mail.email + ">",
        to: obj.to,
        subject: obj.subject,
        html: obj.content,
      };

      const resp = await emailAdapters2[config.adapters.email](data);
      resolve(resp);
    });

    /*********************

        Example object:

        *********************

            {
                to:'exaple@test.com',
                subject: 'Some subject',
                content: 'HTML content',
                onSuccess:function(){

                },
                onError:function(){

                }
            }


        */
  },
};
