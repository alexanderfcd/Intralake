const config = require("./config");

const header = config.mail.header;
const footer = config.mail.footer;

const css = function (obj) {
  var css = "";
  for (var x in obj) {
    css += x + ":" + obj[x] + ";";
  }
  return css;
};
const button = function (text, url, opt) {
  opt = opt || {};
  var defaults = {
    bgColor: "#0B557D",
    color: "#ffffff",
  };
  var settings = Object.assign({}, defaults, opt);
  text = text.toUpperCase();
  var btn =
    "" +
    "<div><!--[if mso]>" +
    '<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="' +
    url +
    '" style="height:45px;v-text-anchor:middle;width:200px;" arcsize="7%" stroke="f" fillcolor="' +
    settings.bgColor +
    '">' +
    "<w:anchorlock/>" +
    "<center>" +
    "<![endif]-->" +
    '<a href="' +
    url +
    '"' +
    'style="background-color:' +
    settings.bgColor +
    ";border-radius:3px;color:" +
    settings.color +
    ';display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:45px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;">' +
    text +
    "</a>" +
    "<!--[if mso]> " +
    "</center>" +
    "</v:roundrect>" +
    "<![endif]--></div>";
  return btn;
};
const wrap = function (content, options) {
  options = options || {};
  var acss = css({
    "font-family":
      "proxima_nova,'Open Sans','Lucida Grande','Segoe UI',Arial,Verdana,'Lucida Sans Unicode',Tahoma,sans-serif",
    "font-size": "15px",
    "border-radius": "4px",
    border: "1px #efecec solid",
    "max-width": "530px",
    margin: "auto",
  });
  var wrap = '<div><table align="center" style="' + acss + '">';
  wrap += '<tr><td valign="top" style="padding:30px;">';
  wrap += options.skipHeader ? "" : header;
  wrap += content;
  wrap += options.skipFooter ? "" : footer;
  wrap += "</tr></td></table></div>";
  return wrap;
};

module.exports = {
  defaultEmail: function (text, conf = {}, lang) {
    if (conf.button) {
      if (conf.button.url && conf.button.url.indexOf("http") === -1) {
        // '/some/path'
        conf.button.url = `${config.uiDomain}${conf.button.url}`;
      }
    }
    var html = text;

    html += conf.button ? button(conf.button.text, conf.button.url) : "";
    return wrap(html);
  },

  css,
  wrap,
  button,
};
