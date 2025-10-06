const emailsService = require("./emails.service");
const config = require("./config");

const defaultCoreEmails = {
  email: emailsService.defaultEmail,

  passwordReset: function (linkUrl) {
    var html = '<p style="padding-bottom:20px;">Hi, <br>';
    html += "There was a request to change your password.<br>";
    html += "If you did not make this request, just ignore this email.<br>";
    html += "</p>";
    html += this.button("Reset my password", linkUrl);
    return this.wrap(html);
  },
  confirmRegistration: function (linkUrl, data) {
    var html = '<h3 style="padding-bottom:20px;">';
    html += "Welcome to " + config.mail.teamName + ".";
    html += "</h3>";
    html +=
      "<p>Welcome to " +
      config.mail.teamName +
      ", please confirm your email address to get started.<br>";
    html += "</p>";
    html += this.button("Confirm Email", linkUrl);
    return {
      html: this.wrap(html),
      subject: config.site.shortName + " Confirm Account",
    };
  },
  passwordRestored: function () {
    var html = '<h3 style="padding-bottom:20px;">';
    html += "Your password was successfully changed.";
    html += "</h3>";
    html += "<p>";
    html += "This is a confirmation that your password was changed.";
    html += "</p>";
    return this.wrap(html);
  },
  projectRoleInvite: function (homeUrl, currProjectData) {
    var html = '<h3 style="padding-bottom:20px;">';
    html += "Project invitation";
    html += "</h3>";
    html += "<p>";
    html += "You have been invited for project collaboration.";
    html += "</p>";
    html += this.button("Sign in to your account", homeUrl);
    return this.wrap(html);
  },
};

const configEmails = config.emails || {};

const defaultEmails = {
  ...emailsService,
  ...defaultCoreEmails,
};

const emails = Object.assign({}, defaultEmails, configEmails);

module.exports = { ...emails };
