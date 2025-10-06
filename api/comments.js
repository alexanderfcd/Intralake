var db = require("./db");
var mongoose = db.mongoose();

var dbUsers = db.users();
var userFunctions = require("./userFunctions");
var user = new userFunctions();
var moment = require("moment");

var perms = require("./perms");
var dbapi = require("./plugins/core-tools/db.js");

module.exports = {
  getCommentsByPostId: async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "previewObject",
      req.params.id,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: can.code },
        status: 400,
      });
      return false;
    }
    var comments = (await db.appConnect(req)).model("comment");
    var usersModel = dbUsers.model("userRegister");
    var query = comments
      .find({ post: mongoose.Types.ObjectId(req.params.id) })
      .sort("-date")
      .populate("author", undefined, usersModel);
    query.exec(function (err, posts) {
      if (err) {
        Respond({
          res: res,
          data: { error: err },
          status: 400,
        });
      } else {
        Respond({
          res: res,
          data: { comments: posts },
          status: 200,
        });
      }
    });
  },
  // todo:
  getCommentsByPostIdNew: async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "previewObject",
      req.params.id,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: can.code },
        status: 400,
      });
      return false;
    }
    var commentsModel = (await db.appConnect(req)).model("comment");
    var usersModel = dbUsers.model("userRegister");

    const [comments, err] = await tools.useAwait(
      dbapi.dbGet(commentsModel, req, undefined, undefined, undefined, {
        post: mongoose.Types.ObjectId(req.params.id),
      })
    );

    Respond({
      res: res,
      data: { comments: comments },
      status: 200,
    });
  },
  postComment: async function (req, res) {
    const can = await perms.can(
      req,
      res,
      "canComment",
      req.body.id,
      GetProject(req)
    );
    if (!can.result) {
      Respond({
        res: res,
        data: { code: "noAccessForComments" },
        status: 400,
      });
      return false;
    }

    const user = can.data;
    var comments = (await db.appConnect(req)).model("comment");
    var content = req.body.comment.replace(/<(?:.|\n)*?>/gm, "").trim();
    if (content.length < 1) {
      Respond({
        res: res,
        data: { message: "Invalid or too short comment." },
        status: 400,
      });
      return false;
    }
    var data = {
      content: content,
      authorId: user.id,
      author: user._id,
      authorName: user.name,
      post: req.body.id,
    };
    comments.create(data, function (err, newComment) {
      if (!!err) {
        Respond({
          res: res,
          data: { message: "Error commenting." },
          status: 400,
        });
      } else {
        Respond({
          res: res,
          data: { message: "Comment Created." },
          status: 200,
        });
      }
    });
  },
  editComment: async function (req, res, doDelete) {
    doDelete = doDelete || false;
    var token = appTools.tool.getToken(req);

    var theID = doDelete ? req.params.id : req.body.id;
    var scope = this;

    var comments = (await db.appConnect(req)).model("comment");
    var users = dbUsers.model("userRegister");
    user.isAuthorOf({ req: req, res: res, id: theID }, function () {
      if (doDelete) {
        comments.findByIdAndRemove(theID, function (err, rdata) {
          if (err) {
            Respond({
              res: res,
              data: { message: "Error." },
              status: 400,
            });
          } else {
            Respond({
              res: res,
              data: { message: "Item Deleted." },
              status: 200,
            });
          }
        });
      } else {
        var data = {
          content: (req.body.comment || req.body.content)
            .replace(/<\/?[^>]+(>|$)/g, "")
            .trim(),
        };
        comments.findById(theID, function (err, theComment) {
          if (!!err) {
            Respond({
              res: res,
              data: { message: "Error commenting." },
              status: 400,
            });
          } else {
            theComment.content = data.content;

            theComment.save(function (err) {
              if (err) {
                Respond({
                  res: res,
                  data: { message: "Error commenting." },
                  status: 400,
                });
                return;
              }
              Respond({
                res: res,
                data: { message: "Comment updated." },
                status: 200,
              });
            });
          }
        });
      }
    });
  },
};
