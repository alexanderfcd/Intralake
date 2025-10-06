(function () {
  const UIEvents = function () {
    const _events = {};
    this.on = function (e, f) {
      _events[e] ? _events[e].push(f) : (_events[e] = [f]);
      return this;
    };
    this.dispatch = function (e, f) {
      _events[e]
        ? _events[e].forEach(function (c) {
            c.call(this, f);
          })
        : "";
    };
  };

  il.guiEvents = new UIEvents();
  il.guiHooks = new UIEvents();
})();

class TemplateRenderer {
  constructor(options = {}) {
    const defaults = {
      document: window.document,
      dispatcher: il.guiHooks,
    };

    this.settings = Object.assign({}, defaults, options);
  }

  #perPage = {};

  getTemplate(template) {
    if (typeof template === "string") {
      template = this.settings.document.querySelector(template);
    }

    return template;
  }
  parseHooks(root = document) {
    if (!root) {
      return;
    }

    root.querySelectorAll("[data-hook-id]").forEach((node) => {
      const target = document.createElement("div");
      node.appendChild(target);

      const hook = node.dataset.hookId;
      if (node.dataset.hookOnce) {
        node.dataset.hookIdRendered = hook;
      }

      setTimeout(() => {
        const renderer = this.pluginRenderer(hook, node, target);
        this.settings.dispatcher.dispatch(hook, renderer, node);
        if (node.dataset.hookOnce) {
          delete node.dataset.hookId;
        }
      }, 0);
    });
  }

  pluginRenderer(hook, hookNode, targetNode) {
    return {
      render: (id, plugin) => {
        if (!plugin && typeof id !== "string") {
          plugin = id;
          id = null;
        }
        if (typeof plugin === "function") {
          plugin = plugin();
        }
        if (!hookNode.__$$data) {
          hookNode.__$$data = {};
        }
        if (!id || (id && !hookNode.__$$data[id])) {
          hookNode.__$$data[id] = true;
        } else {
          return;
        }
        try {
          targetNode.appendChild(plugin);
        } catch (err) {
          console.warn("plugin is not of type element - ", plugin);
        }

        this.parseHooks(hookNode);
      },
    };
  }

  render(template, target) {
    if (!template) {
      return;
    }
    if (!target) {
      target = document.createElement("div");
    }
    template = this.getTemplate(template);
    if (!template) {
      return;
    }

    target.innerHTML = template.innerHTML;

    this.parseHooks(target);

    return target;
  }
}

class FlexContext {
  constructor() {
    this._data = {};
    this.off();
  }

  set(key, value, trigger) {
    trigger = trigger || typeof trigger === "undefined";
    this._data[key] = value;
    if (trigger) {
      this.dispatch(this._data[key]);
    }
  }

  get(key, immutable) {
    immutable = typeof mutable === "undefined" || !!immutable;
    let res = this._data;
    if (immutable) {
      res = { ...this._data };
    }
    if (key) {
      return res[key];
    }
    return res;
  }

  on(key, callback) {
    if (!this._events[key]) {
      this._events[key] = [];
    }
    this._events[key].push(callback);
  }

  dispatch(key) {
    if (!this._events[key]) {
      this._events[key] = [];
    }
    this._events[key].forEach((f) => {
      f.call(undefined, this.get(key));
    });
  }

  off(key) {
    if (!key) {
      this._events = {};
    } else {
      this._events[key] = [];
    }
  }
}

il.LakeStore = new FlexContext();
il.templateRenderer = new TemplateRenderer();

router.on("/404", function () {
  il.view({
    view: "app",
    viewUrl: "/components/404/404.html",
    //guard: notLoggedGuard,
    forced: true,
  });
});
router.on("/login", function () {
  il.view({
    view: "app",
    viewUrl: "/components/login/login.html",
    guard: notLoggedGuard,
    forced: true,
  });
});
router.on("/register", function () {
  il.view({
    view: "app",
    viewUrl: "/assets/views/register.html",
    guard: notLoggedGuard,
    forced: true,
  });
});
router.on("/restore-password", function () {
  il.view({
    view: "app",
    viewUrl: "/assets/views/restore-password.html",
    guard: notLoggedGuard,
    forced: true,
  });
});
router.on("/reset-password", function () {
  il.view({
    view: "app",
    viewUrl: "/assets/views/reset-password.html",
    guard: notLoggedGuard,
    forced: true,
  });
});

var makeAdmin = function () {
  var menu = [
    {
      dataset: { active: null },
      onclick: function () {
        w7.service.goto("backToProject");
      },
      innerHTML: "&larr; Back to project",
    },
    {
      dataset: { perm: "$manageProject", active: "settings" },
      onclick: function () {
        w7.service.goto("projectSettings");
      },
      innerHTML: "Project settings",
    },
    {
      dataset: { perm: "modifyRole", active: "roles" },
      onclick: function () {
        w7.service.goto("projects");
      },
      innerHTML: "Roles",
    },
    {
      dataset: { perm: "modifyRole", active: "users" },
      onclick: function () {
        w7.service.goto("projectUsers");
      },
      innerHTML: "Users",
    },
    {
      dataset: { perm: "modifyRole", active: "access-groups" },
      onclick: function () {
        w7.service.goto("AccessGroups");
      },
      innerHTML: "Access Groups",
    },
    {
      dataset: { perm: "$manageProject", active: "plugins" },
      onclick: function () {
        w7.service.goto("plugins");
      },
      innerHTML: "Plugins",
    },
    {
      dataset: { perm: "$manageProject", active: "delete-project" },
      onclick: function () {
        w7.service.goto("delete-project");
      },
      innerHTML: "Delete project",
    },
  ];

  setTimeout(function () {
    var root = document.getElementById("admin-menu-list");
    if (!!root.firstElementChild) {
      return;
    }

    il.dispatch("beforeAdminMenu", menu);

    menu.forEach(function (itm) {
      root.append(w7.el(itm));
    });
    il.dispatch("afterAdminMenu", root);
  });
};

router.on("/admin/:id/settings", function () {
  il.view({
    view: "admin",
    guard: loggedGuard,
    source: "#tpl-admin",
    forced: false,
    beforeRender: function (el) {
      makeAdmin();
      w7.view.rend("project-settings", ".admin-content", function () {
        w7.bearerGet(
          w7.apiurl("/project/" + getProject()),
          {},
          function (data) {
            w7.$("#project-name").val(data.name);
            w7.$("#project-description").val(data.description);
            w7.internalUploader({
              element: "#project-image-update",
              value: data.image && data.image !== "false" ? data.image : false,
            });
            w7.pageTitle(w7.lang("Project settings"));
          }
        );
      });
    },
  });
});

router.on("/admin/:id/roles", function () {
  il.view({
    view: "admin",
    guard: loggedGuard,
    source: "#tpl-admin",
    forced: false,
    beforeRender: function (el) {
      makeAdmin();
      w7.view.rend("roles", ".admin-content", function () {
        w7.roles.getAndRender("#roles-table");
      });
    },
  });
});
router.on("/admin/:id/roles/:role", function () {
  il.view({
    view: "admin",
    guard: loggedGuard,
    source: "#tpl-admin",
    forced: false,
    beforeRender: function (el) {
      makeAdmin();
      w7.view.rend("role", ".admin-content", function () {
        w7.role.rendRoles();
        wuic.tabs();
        if (w7.win.location.pathname.split("/").pop().indexOf("add") === -1) {
          w7.$(".view-role-edit .wtab-nav").show();
        }
      });
    },
  });
});

router.on("/admin/:id/users", function () {
  il.view({
    view: "admin",
    guard: loggedGuard,
    source: "#tpl-admin",
    forced: false,
    beforeRender: function (el) {
      makeAdmin();
      w7.view.rend("users", ".admin-content", function () {
        w7.users.getAndRender("#users-table");
      });
    },
  });
});

router.on("/admin/:id/access-groups", function () {
  il.view({
    view: "admin",
    guard: loggedGuard,
    source: "#tpl-admin",
    forced: false,
    beforeRender: function (el) {
      makeAdmin();

      var acel = w7.el({
        content: [
          {
            tag: "a",
            className: "wui-btn wui-btn-outline",
            innerHTML: w7.lang("Create Access group"),
            onclick: function () {
              setPath("/admin/" + getProject() + "/access-group/" + 0);
            },
          },
          { tag: "br" },
          { tag: "br" },
          { id: "access-groups-root" },
        ],
      });

      setTimeout(function () {
        document.querySelector(".admin-content").innerHTML = "";
        document.querySelector(".admin-content").appendChild(acel);
        w7.accessGroups.getAndRender("#access-groups-root");
      });
    },
  });
});

router.on("/admin/:id/access-group/:group", function () {
  il.view({
    view: "admin",
    guard: loggedGuard,
    source: "#tpl-admin",
    forced: false,
    beforeRender: function (el) {
      makeAdmin();

      w7.view.rend("access-group-edit", ".admin-content", function () {});
    },
  });
});

router.on("/admin/:id/plugins", function () {
  il.view({
    view: "admin",
    guard: loggedGuard,
    source: "#tpl-admin",
    forced: false,
    beforeRender: function (el) {
      w7.ifCan("$manageProject", undefined, function (can) {
        if (can) {
          makeAdmin();
          w7.view.rend("project-plugins", ".admin-content", function () {});
          var rendPlugins = function () {
            wuic.preload(true, "#plugins-list", true);
            w7.bearerGet(
              w7.apiurl("/project-data/" + getProject()),
              {},
              function (data) {
                var holder = document.getElementById("plugins-list");
                document
                  .getElementById("add-plugin-btn")
                  .addEventListener("click", function () {
                    var footer = w7.modalFooter();
                    var result = {};
                    var modal = new w7.modal({
                      content: document.querySelector("#add-plugin-template")
                        .innerHTML,
                      width: 520,
                      height: "auto",
                      footer: footer.footer,
                      title: lang("Add plugin"),
                    });
                    footer.ok.addEventListener("click", function () {
                      var postData = {
                        slug: modal.modalContainer.querySelector(
                          '[name="slug"]'
                        ).value,
                        // version: modal.modalContainer.querySelector('[name="version"]').value,
                      };
                      wuic.preload(true, modal.modalContainer, true);
                      w7.bearerPost(
                        w7.apiurl("/add-plugin"),
                        postData,
                        function (data) {
                          wuic.preload(false, modal.modalContainer, true);
                          modal.remove();
                          rendPlugins();
                          wuic.notify(lang("Plugin added"));
                        }
                      ).fail(function (e) {
                        wuic.preload(false, modal.modalContainer, true);
                      });
                    });
                    footer.ok.disabled = true;

                    modal.modalContainer
                      .querySelector('[name="slug"]')
                      .addEventListener("input", function () {
                        footer.ok.disabled = !this.value.trim();
                      });

                    modal.modalContainer
                      .querySelector('[name="slug"]')
                      .addEventListener("input", function () {
                        footer.ok.disabled = !this.value.trim();
                      });

                    footer.cancel.onclick = function () {
                      modal.remove();
                    };
                  });
                if (data.plugins.length === 0) {
                  holder.innerHTML = "No plugins";
                } else {
                  var table = w7.objects.table(
                    data.plugins,
                    {
                      name: "auto",
                      slug: "auto",
                      Author: "270px",
                    },
                    {
                      index: false,

                      Author: function (obj) {
                        return displayName(obj.addedBy);
                      },
                      menu: [
                        {
                          title: lang("Delete"),
                          action: function (curr) {
                            w7.confirm(
                              lang("Are you sure you want to delete") +
                                "<br><b>" +
                                curr.name +
                                "</b>",
                              function () {
                                wuic.preload(true, "#plugins-list", true);
                                w7.bearerPost(
                                  w7.apiurl("/remove-plugin/" + curr._id),
                                  {},
                                  function (data) {
                                    wuic.preload(false, "#plugins-list", true);
                                    rendPlugins();
                                  }
                                );
                              }
                            );
                          },
                        },
                      ],
                    }
                  );
                  var holder = document.getElementById("plugins-list");

                  holder.innerHTML = "";
                  holder.appendChild(table[0]);
                }
                wuic.preload(false, "#plugins-list", true);
              }
            );
          };

          rendPlugins();
        }
      });
    },
  });
});

router.on("/admin/:id/delete-project", function () {
  il.view({
    view: "admin",
    guard: loggedGuard,
    source: "#tpl-admin",
    forced: false,
    beforeRender: function (el) {
      w7.ifCan("$manageProject", undefined, function (can) {
        if (can) {
          makeAdmin();
          w7.view.rend("delete-project", ".admin-content", () => {
            var prepare = function () {
              w7.bearerGet(
                w7.apiurl("/project-data/" + getProject()),
                {},
                function (data) {
                  if (data.isEmpty) {
                    $('[data-action="delete-project"]')
                      .attr("disabled", false)
                      .on("click", function () {
                        w7.confirm(
                          lang(
                            "Are you sure you want to delete project?<br>This action is irreversible!"
                          ) + "?",
                          function (confirmed) {
                            wuic.preload(true, ".admin-content", true);
                            w7.bearerPost(
                              w7.apiurl("/delete-project/" + getProject()),
                              {},
                              function (data) {
                                wuic.preload(false, ".admin-content", true);
                                il.goto("/");
                                wuic.notify(lang("Project removed"));
                              }
                            );
                          }
                        );
                      });
                  }
                }
              );
            };

            prepare();

            w7.pageTitle("Delete project");
          });
        }
      });
    },
  });
});

router.on("/profile", function () {
  il.view({
    view: "profile",
    guard: loggedGuard,
    source: "#tpl-profile",
    forced: false,
    beforeRender: function (el) {
      w7.view.rend("profile", "#admin-user-profile", () => {
        w7.xhr.user(function (userResp) {
          w7.storage("userData", userResp);
          const data = w7.storage("userData");
          w7.$('[type="text"],textarea,select', "#profile-block").each(
            function () {
              w7.$(this).val(data[this.name]);
            }
          );
          w7.internalUploader({
            element: "#profile-image",
            label: "Upload Image",
            value: data.image && data.image !== "false" ? data.image : false,
          });
        });

        w7.pageTitle("Profile");
      });
    },
  });
});

router.on("/billing", function () {
  il.view({
    view: "billing",
    guard: loggedGuard,
    source: "#tpl-billing",
    forced: false,
    beforeRender: function (el) {
      w7.view.rend("billing", "#admin-user-billing", () => {
        w7.xhr.billing(function (data) {
          console.log(data);
        });

        w7.pageTitle("Billing");
      });
    },
  });
});

router.on("/confirm", function () {
  il.view({
    view: "confirm",
    guard: loggedGuard,
    source: "#tpl-confirm",
    forced: false,
    beforeRender: function (el) {
      w7.view.rend("confirm", "#admin-user-confirm", () => {
        document
          .querySelector("#resend-confirmation")
          .addEventListener("click", async () => {
            wuic.preload(true, "#confirm-root", true);

            const xhr = w7.bearerPost(
              w7.apiurl("/resend-confirmation"),
              {},
              function (data) {
                wuic.notify(lang("Notification sent"));
              }
            );
            w7.xhr._handle(xhr);

            const [data, err] = await il.useWait(xhr.promise());

            wuic.preload(false, "#confirm-root", true);
          });

        w7.pageTitle("Confirm");
      });
    },
  });
});

il.getProjectsData = function (c) {
  var dt = w7.storage("projectsData");
  if (dt) {
    c.call(this, dt);
  } else {
    w7.bearerGet(w7.apiurl("/projects"), {}, function (projects) {
      w7.storage("projectsData", projects);
      c.call(this, projects);
    });
  }
};
