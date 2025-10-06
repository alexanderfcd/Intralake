const config = require("./config");

/*

    result = {
        adapter: 'sendgrid',
        type: 'success',
        ok: true,
        response: {}
    };

*/

module.exports = {
  sendgrid: async (data) => {
    return new Promise((resolve) => {
      const result = { adapter: "sendgrid" };
      const sendgrid = require("@sendgrid/mail");
      sendgrid.setApiKey(config.sendgrid.api_key);
      data.from = config.sendgrid.senderFrom;
      sendgrid.send(data).then(
        (res) => {
          result.type = "success";
          result.ok = true;
          result.response = res.response;

          resolve(result);
        },
        (error) => {
          //console.log('err1', error);
          //console.log('err2', error.response.body);

          result.type = "error";
          result.ok = false;
          result.response = res.response.body;
          result.displayMessage = res.response.body.message;
          resolve(result);
        }
      );
    });
  },
  mailgun: async (data) => {
    const result = { adapter: "mailgun" };
    return new Promise((resolve) => {
      var mailgun = require("mailgun-js")({
        apiKey: config.mailgun.api_key,
        domain: config.uiDomain,
      });
      mailgun.messages().send(data, function (error, reply) {
        if (!error) {
          result.type = "success";
          result.ok = true;
          result.response = reply;
          result.displayMessage = "";

          resolve(result);
        } else {
          result.type = "error";
          result.ok = false;
          result.response = error;
          result.displayMessage = "";

          resolve(result);
        }
      });
    });
  },
  noop: async (data) => {
    const result = {};
    return new Promise((resolve) => {
      result.type = "success";
      result.ok = true;
      result.response = "-";
      result.adapter = "noop";
      resolve(result);
    });
  },
};
