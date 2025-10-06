var router = new il.Router({
  // base: '/'
});
il.router = router;
var _project = null;
il.router.on("$change", function () {
  var project = w7.getProject();
  if (_project !== project) {
    _project = project;
    il.dispatch("projectChange", _project);
  }

  w7.__dataActive();

  setTimeout(function () {
    w7.__dataActive();
  }, 10);
});

var loggedGuard = function () {
  var tk = !!w7.getStorageToken();

  if (!tk) {
    il.goto("/login");
  }
  return tk;
};

var notLoggedGuard = function () {
  var tk = !w7.getStorageToken();
  if (!tk) {
    il.goto("/");
  }
  return tk;
};

router.on("/", function () {
  if (il.config.homeURL !== "/") {
    il.goto(il.config.homeURL);
  } else {
    il.view({
      view: "app",
      viewUrl: "/components/home/home.html",
      guard: loggedGuard,
      forced: true,
    });
  }
});

var FolderObjectLayout = function (el) {
  var hasLayout = !!document.getElementById("FolderObjectLayout");
  if (!hasLayout) {
    var layout = w7.el({
      className: "app-main",
      id: "FolderObjectLayout",
      content: [
        {
          className: "app-bar",
          css: {
            display: !w7.getStorageToken() ? "none" : "",
          },
          content: [
            {
              className: "main-grid",
              content: [
                {
                  className: "main-grid-side-1",
                },
                {
                  className: "main-grid-content",
                  content: [
                    {
                      className: "main-grid-content-flex",
                      content: [new CreateButton().root, new Search().root],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          className: "main-grid",
          content: [
            {
              className: "main-grid-side-1",
              content: [
                {
                  id: "tree-view",
                },
                {
                  className: "main-tree-mobile-menu",
                  innerHTML: '<span class="material-icons">menu</span>',
                },
              ],
            },
            {
              className: "main-grid-content",
              content: [
                {
                  className: "actions-head",
                  content: [
                    {
                      id: "path",
                      className: "path",
                    },
                  ],
                },
                {
                  className: "deep-view",
                  id: "folder-table-view",
                },
              ],
            },
          ],
        },
      ],
    });
    el.innerHTML = "";
    el.appendChild(layout);
    makeTree();

    var tb = document.getElementById("folder-table-view");

    var lt = null;

    tb.addEventListener("dragleave", function (e) {
      lt = setTimeout(function () {
        tb.classList.remove("file-drag-over");
      }, 100);
    });
    tb.addEventListener(
      "drop",
      function (e) {
        e.preventDefault();
        tb.classList.remove("file-drag-over");
        var item = e.dataTransfer.items[0];
        var hasFile = item.kind === "file";

        if (hasFile) {
          var files = e.dataTransfer.files;
          w7.objects.uploader(files, true);
        }
      },
      false
    );

    ["dragenter", "dragover"].forEach(function (event) {
      tb.addEventListener(event, function (e) {
        e.preventDefault();
        var item = e.dataTransfer.items[0];
        var hasFile = item.kind === "file";
        if (hasFile) {
          clearTimeout(lt);
          tb.classList.add("file-drag-over");
        } else {
          tb.classList.remove("file-drag-over");
        }
      });
    });
  }

  if (location.pathname.indexOf("/object/") === -1) {
    if (!document.getElementById("folder-view-root")) {
      var source = document.getElementById("tpl-folder-table").innerHTML;
      var root = document.getElementById("folder-table-view");
      root.innerHTML = source;
      setTimeout(function () {
        root
          .querySelector('[data-action="refresh"]')
          .addEventListener("click", function () {
            w7view.files.view();
          });

        root
          .querySelector('[data-action="delete"]')
          .addEventListener("click", function () {
            var ids = [];
            w7.each(".wui-select-icon input", function () {
              if (this.checked) {
                ids.push(this.value);
              }
            });
            w7.objects.deleteMany(ids);
          });
        root
          .querySelector("#selectall-check")
          .addEventListener("input", function () {
            var node = this;

            w7.each("#table-view-body input", function () {
              this.checked = node.checked;
            });

            w7view.files.tblvMultiselect();
          });
      }, 78);
    }
  } else {
    var source = document.getElementById("tpl-file-view");
    var root = document.getElementById("folder-table-view");

    il.templateRenderer.render(source, root);
  }
};

var projectView = function () {
  il.getProjectsData(function (projects) {
    var projectId = il.router.getPathParams().project;
    var project = projects.filter(function (p) {
      return p._id === projectId;
    });
    var projectView = project.defaultView || "folder";
    if (projectView === "folder") {
      il.view({
        view: "folder",
        guard: loggedGuard,
        forced: true,
        beforeController: function (el) {
          FolderObjectLayout(el);

          makeTree();
          tableView();
        },
      });
    } else {
    }
  });
};

router.on("/project/:id", projectView);
router.on("$search/project/:id", projectView);
router.on("/project/:id/folder/:folder_id", projectView);
router.on("$search/project/:id/folder/:folder_id", projectView);

const button = function (opt) {
  const node = document.createElement("button");
  if (opt.icon) {
    node.innerHTML = '<i class="material-icons">' + opt.icon + "</i>";
  } else if (opt.content) {
    node.innerHTML = opt.content;
  }
  if (opt.tip) {
    node.setAttribute("wtip", opt.tip);
  }
  if (opt.action && typeof node.action === "string") {
    node.dataset.action = opt.action;
  }
  return node;
};

w7.editor = function (el, content) {
  var currcontent = content;

  var editor = new Editor({
    element: el,
    content: content,
    enableInputRules: true,
    enablePasteRules: true,
    transformPasted: true,
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      $Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: "max-width: 100%",
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
  });
  window.editor = editor;

  w7.each(".btn-editor-save", function () {
    this.onclick = function () {
      this.disabled = true;
      wuic.loading(true);
      const html = editor.getHTML();
      const blob = new Blob([html], { type: "text/html" });
      w7.objects.uploadVersion({
        file: blob,
        id: w7.getObject(),
        folder: w7.getFolder(),
        action: "edit",
        done: function () {
          wuic.loading(false);
          wuic.notify(w7.lang("Object updated"));
        },
      });
    };
  });

  var toolbar = document.createElement("div");
  toolbar.className = "editor-toolbar";

  const controlls = [
    { action: "bold", tip: w7.lang("Bold"), icon: "format_bold" },
    { action: "italic", tip: w7.lang("Italic"), icon: "format_italic" },
    { action: "strike", tip: w7.lang("Strike"), icon: "format_strikethrough" },
    {
      action: function () {
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
          .run();
      },
      tip: w7.lang("Insert table"),
      icon: "table_view",
    },
    {
      action: function () {
        editor.commands.setHorizontalRule();
      },
      actionName: "setHorizontalRule",
      tip: w7.lang("Horizontal Rule"),
      icon: "horizontal_rule",
    },
    {
      actionName: "setImage",
      action: () => {
        var footer = w7.modalFooter();
        var result = {};
        var input = document.createElement("input");
        input.type = "file";

        input.onchange = function () {
          var file = this.files[0];

          var reader = new FileReader();
          reader.onload = function () {
            var base64 = reader.result;

            editor.commands.setImage({ src: base64 });
            modal.remove();
          };
          reader.readAsDataURL(file);
        };

        var modal = new w7.modal({
          content: input,
          width: 520,
          height: "auto",
          footer: footer.footer,
          title: lang("Add plugin"),
        });
        footer.cancel.onclick = function () {
          modal.remove();
        };
        footer.ok.onclick = function () {
          editor.commands.setImage({ src: "https://picsum.photos/400" });
          modal.remove();
        };
      },
      tip: w7.lang("Insert Image"),
      icon: "image",
    },
  ];

  controlls.forEach(function (ctrl) {
    if (!ctrl.type || ctrl.type === "button") {
      const btn = button({
        ...ctrl,
      });
      btn.onclick = function () {
        if (typeof ctrl.action === "string") {
          const act =
            ctrl.action.charAt(0).toUpperCase() + ctrl.action.slice(1);
          editor.chain().focus()["toggle" + act]().run();
        } else {
          ctrl.action();
        }
      };
      ctrl.button = btn;
      toolbar.append(btn);
    }
  });

  const manageStates = () => {
    controlls.forEach(function (ctrl) {
      ctrl.button.classList[
        editor.isActive(ctrl.actionName || ctrl.action) ? "add" : "remove"
      ]("active");
    });
  };

  editor.on("selectionUpdate", () => {
    manageStates();
  });

  editor.on("focus", () => {
    manageStates();
  });

  editor.on("update", (a, b) => {
    manageStates();
    if (currcontent !== editor.getHTML()) {
      w7.each(".btn-editor-save", function () {
        this.disabled = false;
      });
    }
  });
  w7.$(el).before(toolbar);
};

var objectController = function (el) {
  objectView(getPathParam("object"), getPathParam("v"));
  wuic.path.init("#path");
  w7.$("#form-comments [name='id']").val(getObject());
  loggedIn = !!w7.getStorageToken();
  if (loggedIn) {
    w7.$("#form-comments").show();
  }

  $("#form-comments [name='id']").val(getObject());
  wuic.textAreaAutoHeight($('#form-comments [name="comment"]')[0]);
  $(w7).on("commentCreated", function () {
    wuic.comments.init(getObject());
    $('#form-comments [name="comment"]').val("");
    $("#form-comments button")[0].disabled = false;
  });

  $("#form-comments textarea")
    .on("input", function () {
      var val = $(this).val().trim();
      if (!val) {
        $("#form-comments button").attr("disabled", true);
      } else {
        $("#form-comments button").removeAttr("disabled");
      }
    })
    .on("focus", function () {
      $("#form-comments").addClass("focus-like");
      var val = $(this).val().trim();
      if (!val) {
        $("#form-comments button").attr("disabled", true);
      } else {
        $("#form-comments button").removeAttr("disabled");
      }
    });
  $("#form-comments .wui-btn-link").on("click", function () {
    $("#form-comments").removeClass("focus-like");
    $("#form-comments textarea").val("");
  });
  $("#form-comments textarea").on("blur", function () {
    var val = $(this).val().trim();
    if (!val) {
      $("#form-comments").removeClass("focus-like");
      $("#form-comments button").attr("disabled", true);
    } else {
      $("#form-comments button").removeAttr("disabled");
    }
  });
};

var makeTree = function () {
  var el = document.getElementById("tree-view");
  var tk = !!w7.getStorageToken();

  if (el) {
    if (!tk) {
      el.style.display = "none";
      document.querySelector(".main-tree-mobile-menu").style.display = "none";
      return;
    }
    var currItem = {};
    if (!el.__tree) {
      wuic.treeView = new wuic.Tree({
        element: "#tree-view",
        onSelect: function (obj, node) {
          currItem = obj;

          goToFolder(obj._id, obj.project);
          // w7.service.setSearchPlaceholder(currItem)
        },
        onProjectSelect: function (obj, node) {
          currItem = obj;
          goToProject(obj._id);
          w7.service.setSearchPlaceholder(currItem);
        },
        onProjectSwitch: function (obj, node) {
          currItem = obj;
          goToProject(obj._id);
          w7.service.setSearchPlaceholder(currItem);
        },
      });

      wuic.treeView.$events.on("ready", function (a, b) {
        w7.service.setSearchPlaceholder(wuic.treeView.projectData);
      });

      el.__tree = wuic.treeView;
      document
        .querySelectorAll(".main-tree-mobile-menu")
        .forEach(function (menu) {
          menu.addEventListener("mousedown", toggleMobileMenu, {
            passive: true,
          });
          menu.addEventListener("touchstart", toggleMobileMenu, {
            passive: true,
          });
        });

      function toggleMobileMenu() {
        this.parentNode.classList.toggle("tree-mobile-active");
      }
    }
  }
};

router.on("/project/:id/object/:object_id", async function () {
  il.view({
    view: "folder",
    // guard: loggedGuard,
    guard: async function () {
      var tk = !!w7.getStorageToken();
      if (tk) {
        return true;
      }
      return true;
    },
    forced: true,
    beforeController: function (el) {
      FolderObjectLayout(el);
      makeTree();
      objectController();
    },
  });
});

router.on("/project/:id/object/:object_id/edit", function () {
  il.view({
    view: "folder",
    guard: loggedGuard,
    forced: true,
    beforeController: function (el) {
      FolderObjectLayout(el);
      objectController();
    },
  });
});

router.on("/project/:id/object/:object_id/v/:version_id", function () {
  il.view({
    view: "folder",
    guard: loggedGuard,
    forced: true,
    beforeController: function (el) {
      FolderObjectLayout(el);
      objectController();
    },
  });
});

router.on("/dashboard/project/:id", function () {
  il.view({
    view: "dashboard",
    guard: loggedGuard,
    source: "#tpl-dashboard",
    forced: false,
    beforeRender: function (el) {
      w7.bearerGet(
        w7.apiurl("/project/" + w7.getProject() + "/dashboard"),
        {},
        function (data) {
          var inf = document.getElementById("dashboard-info");
          inf.innerHTML = `
<h2 class="title"><a href="/project/${w7.getProject()}">Project: "${
            data.project.name
          }"</a></h2>
        
        <div  class='dashboard-activity-thumb' >Number of files: <b class="dashboard-activity-thumb-value">${
          data.project.totalFiles
        }</b> </div>
        <div  class='dashboard-activity-thumb' >Number of folders: <b class="dashboard-activity-thumb-value">${
          data.project.totalFolders
        }</b></div>
        <div  class='dashboard-activity-thumb' >Project size: <b class="dashboard-activity-thumb-value">${w7.obSize(
          data.project.totalSize
        )}</b></div>
        <div  class='dashboard-activity-thumb' >Number of file versions: <b class="dashboard-activity-thumb-value">${
          data.project.totalVersions
        }</b></div>
        <div  class='dashboard-activity-thumb' >Project users: <b class="dashboard-activity-thumb-value">${
          data.project.users.length
        }</b></div>
        `;

          var act = document.getElementById("dashboard-activity");
          var comm = document.getElementById("dashboard-comments");

          var actPage = 2;
          var actPageStop = false;
          var loading = false;

          act.addEventListener("scroll", (event) => {
            var element = event.target;
            if (
              element.scrollHeight - (element.scrollTop + 100) <=
              element.clientHeight
            ) {
              if (!loading && !actPageStop) {
                loading = true;
                w7.bearerGet(
                  w7.apiurl(
                    "/project/" +
                      w7.getProject() +
                      "/dashboard/activity?page=" +
                      actPage
                  ),
                  {},
                  function (data) {
                    if (data.length === 0) {
                      actPageStop = true;
                      return;
                    }
                    actPage++;
                    data.forEach(function (item) {
                      var li = document.createElement("li");

                      var ext = "";
                      if (item.action === "rename") {
                        ext =
                          " <a onclick=\"setPath('/project/" +
                          w7.getProject() +
                          "/object/" +
                          item.object +
                          '\');return false;" href="/project/' +
                          w7.getProject() +
                          "/object/" +
                          item.object +
                          '">from <b>' +
                          item.previousName +
                          "</b> to <b>" +
                          item.name +
                          "</b></a>";
                      } else if (item.action === "create") {
                        ext =
                          " <a onclick=\"setPath('/project/" +
                          w7.getProject() +
                          "/object/" +
                          item.object +
                          '\');return false;" href="/project/' +
                          w7.getProject() +
                          "/object/" +
                          item.object +
                          '"><b>' +
                          item.name +
                          "</b></a>";
                      }

                      li.innerHTML = `<span wtip="${new Date(
                        item.date
                      ).toLocaleString()}">${item.ago}</span> ${w7.displayName(
                        item.author
                      )} has ${item.action}d ${
                        item.subtype || item.type
                      }${ext}`;
                      act.appendChild(li);
                    });
                    loading = false;
                  }
                );
              }
            }
          });

          data.activity.forEach(function (item) {
            var li = document.createElement("li");

            var ext = "";
            if (item.action === "rename") {
              ext =
                " <a onclick=\"setPath('/project/" +
                w7.getProject() +
                "/object/" +
                item.object +
                '\');return false;" href="/project/' +
                w7.getProject() +
                "/object/" +
                item.object +
                '">from <b>' +
                item.previousName +
                "</b> to <b>" +
                item.name +
                "</b></a>";
            } else if (item.action === "create") {
              ext =
                " <a onclick=\"setPath('/project/" +
                w7.getProject() +
                "/object/" +
                item.object +
                '\');return false;" href="/project/' +
                w7.getProject() +
                "/object/" +
                item.object +
                '"><b>' +
                item.name +
                "</b></a>";
            }

            li.innerHTML = `<span wtip="${new Date(
              item.date
            ).toLocaleString()}">${item.ago}</span> ${w7.displayName(
              item.author
            )} has ${item.action}d ${item.subtype || item.type}${ext}`;
            act.appendChild(li);
          });

          data.comments.data.forEach(function (item) {
            var li = document.createElement("li");
            li.setAttribute("wtip", new Date(item.date).toLocaleString());
            li.innerHTML = `${item.ago} ${w7.displayName(
              item.author
            )} has commented on ${item.post?.name}`;
            comm.appendChild(li);
          });
        }
      );
    },
  });
});
