/*import * as Y from "yjs";
import {WebrtcProvider} from "y-webrtc";
import {Editor} from "@tiptap/core";
import {defaultExtensions} from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";*/

w7.view.file = {
  _saving: false,
  public: function (state) {
    if (!this._saving) {
      this._saving = true;
      w7.xhr.setPublic(w7.viewData.context._id, state).done(function () {
        w7.view.file._saving = false;
      });
    }
  },
  publicToggle: function () {
    this.public(!w7.viewData.context.public);
  },
};

w7view.file = {
  createCantPreview: function () {
    return $(
      '<div class="w7-no-preview-available">Preview is not available</div>'
    )[0];
  },
  cantPreview: function (obj) {
    var ext = obj.name.split(".").pop();

    if (ext === "zip" || ext === "rar") {
      return w7view.file.createCantPreview();
    }

    var archives = [
      "application/x-rar-compressed",
      "application/octet-stream",
      "application/zip",
      "application/octet-stream",
      "application/x-zip-compressed",
      "multipart/x-zip",
    ];
    if (archives.indexOf(obj.mimeType) !== -1) {
      return w7view.file.createCantPreview();
    }
  },
  isCSV: function (obj) {
    var mimes = [
      "text/comma-separated-values",
      "text/csv",
      "application/csv",
      "application/excel",
      "application/vnd.ms-excel",
      "application/vnd.msexcel",
    ];
    return mimes.indexOf(obj.mimeType) !== -1;
  },
  isDoc: function (obj) {
    var mimes = [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    return mimes.indexOf(obj.mimeType) !== -1;
  },
};
w7view.files = {
  _view: null,

  view: function () {
    return this.tableView();
  },
  objectInfo: function (obj, vers) {
    var tgInput = document.createElement("input");
    tgInput.value = obj.tags || "";
    // tgInput.disabled = true;
    $(".oit-tags").empty().append(tgInput);

    w7.ifCan("modifyObject", function (can) {
      var tagify = new Tagify(tgInput, {
        editTags: can,
        placeholder: "Add tag",
      });
      tagify.on("add", function () {
        wuic.preload(true, "tags", true);
        var data = [];
        tagify.value.forEach(function (part) {
          data.push(part.value);
        });
        w7.xhr.saveTags(data, obj._id, function () {
          wuic.preload(false, "tags");
        });
      });
      tagify.on("remove", function () {
        wuic.preload(true, "tags", true);
        var data = [];
        tagify.value.forEach(function (part) {
          data.push(part.value);
        });
        w7.xhr.saveTags(data, obj._id, function () {
          wuic.preload(false, "tags");
        });
      });
    });

    var activeVersion = obj.versions[0];
    if (vers) {
      obj.versions.forEach(function (item) {
        if (item._id === vers) {
          activeVersion = item;
        }
      });
    }

    $(".oit-author").html(w7.displayName(obj.author));
    $(".oit-modified").html(w7.displayName(obj.versions[0].author));
    $(".oit-type").html(obj.subtype || obj.mimeType || obj.type);
    $(".oit-created").html(userDate(obj.date) + "<br>" + userTime(obj.date));
    $(".oit-updated").html(
      userDate(activeVersion.date) + "<br>" + userTime(activeVersion.date)
    );
    $(".oit-size").html(w7.obSize(activeVersion.size));
    var src = w7.objectDownloadURL(obj._id, activeVersion._id);
    var dname = obj.name;
    if (dname !== activeVersion.name) {
      dname += "." + activeVersion.name.split(".").pop();
    }
    $("#ov-download").attr("href", src).attr("download", dname);
    var versionsTable = !w7.getStorageToken()
      ? ""
      : w7.objects.table(
          obj.versions,
          {
            name: "auto",
            Author: "270px",
            action: "70px",
            date: "auto",
          },
          {
            index: false,
            menuCase: function (curr) {
              return (
                curr.type !== "folder" &&
                (curr.action === "reupload" ||
                  curr.action === "create" ||
                  curr.action === "edit")
              );
            },
            Author: function (obj) {
              return displayName(obj.author);
            },
            menu: [
              {
                title: lang("View"),
                action: function (curr) {
                  goToObject(obj._id, curr._id);
                },
              },
              {
                title: lang("Download"),
                action: function (curr) {
                  var link = $("<a>");
                  var src = w7.objectDownloadURL(obj._id, curr._id);
                  var dname = obj.name;
                  if (dname !== curr.name) {
                    dname += "." + curr.name.split(".").pop();
                  }
                  link
                    .attr("href", src)
                    .html(dname)
                    .attr("download", curr.name);
                  $(document.body).append(link);
                  link[0].click();
                  setTimeout(function () {
                    link.remove();
                  }, 10);
                },
              },
            ],
          }
        );
    $(".object-info-versions").empty().append(versionsTable);
    w7.event.dispatch("ObjectInfoReady", [w7.viewData.context]);
  },
  createPreviewTag: function (type) {
    if (!type) return;
    const msDocs = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    const xls = [
      "application/vnd.ms-excel",
      "application/vnd.ms-excel",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
      "application/vnd.ms-excel.template.macroEnabled.12",
      "application/vnd.ms-excel.addin.macroEnabled.12",
      "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
    ];

    if (msDocs.indexOf(type) !== -1) {
      return "iframe";
    } else if (xls.indexOf(type) !== -1) {
      return "iframe";
    } else if (type.indexOf("image") !== -1) {
      return "img";
    } else if (type.indexOf("video") !== -1) {
      return "video";
    } else if (type.indexOf("xml") !== -1) {
      return "pre";
    } else if (type === "text/plain") {
      return "pre";
    } else {
      return "iframe";
    }
  },
  previewCSV: function (src, c) {
    var frame = document.createElement("div");
    frame.src = src;
    frame.controls = true;
    frame.className = "object-preview-frame";
    $.get(src, function (data) {
      var csvarr = $.csv.toArrays(data);
      if (!csvarr.length) {
        if (c) {
          c.call();
        }
        return;
      }
      var table = $(
        '<table class="wui-component wui-table user-document-table"><thead><tr></tr></thead><tbody></tbody></table>'
      );
      var theadtr = table.find("thead tr");
      var tbody = table.find("tbody");
      var th = 0,
        l = csvarr[0].length;
      var tr = 1;
      for (; th < l; th++) {
        var itemth = document.createElement("th");
        itemth.innerHTML = csvarr[0][th];
        theadtr.append(itemth);
      }
      for (; tr < l; tr++) {
        var row = csvarr[tr];
        var rowElement = document.createElement("tr");
        var i = 0;
        for (; i < l; i++) {
          var cellElement = document.createElement("td");
          cellElement.innerHTML = row[i];
          rowElement.appendChild(cellElement);
        }
        tbody.append(rowElement);
      }

      table.appendTo(frame);
      if (c) {
        c.call();
      }
    });
    return frame;
  },
  createBPMN: function (src, c) {
    var frame = document.createElement("div");
    frame.src = src;
    frame.controls = true;
    frame.className = "object-preview-frame";
    $.get(src, function (data) {
      console.log(data);
    });
    return frame;
  },
  createSpreadSheetEditNode: function (src, c) {
    var isEdit = location.pathname.includes("/edit");

    var frame = document.createElement("div");
    frame.className =
      "richtext-editor-box richtext-editor-box-sheet richtext-editor-box-shee--mode-" +
      (isEdit ? "edit" : "read");
    frame.style.height = "calc(100vh - 250px)";
    frame.style.position = "relative";
    frame.style.zIndex = "1";

    // todo: compare https://github.com/wolf-table/table

    const sheetConfig = {
      mode: isEdit ? "edit" : "read",
      showToolbar: isEdit,
      showGrid: true,
      showContextmenu: isEdit,
      showBottomBar: isEdit,
      autoFocus: isEdit,
      view: {
        height: () => frame.offsetHeight,
        width: () => frame.offsetWidth,
      },
      row: {
        len: 100,
        height: 25,
      },
      col: {
        len: Math.round(frame.offsetWidth / 100),
        width: 100,
        indexWidth: 60,
        minWidth: 60,
      },
    };

    setTimeout(function () {
      var xs = x_spreadsheet(frame, sheetConfig);

      var xsPrintNode = document.querySelector(".x-spreadsheet-print");
      if (xsPrintNode) {
        var appMain = document.querySelector(".app-main");
        if (appMain) {
          appMain.appendChild(xsPrintNode);
        }
        xsPrintNode.style.position = "fixed";
      }

      function saveXLSX() {
        XLSX.writeFile(xtos(xs.getData()), w7.viewData.context.name + ".xlsx", {
          compression: true,
        });
      }

      $("#ov-download")
        .removeAttr("href")
        .on("click", function (e) {
          saveXLSX();
          e.preventDefault();
        });

      if (isEdit) {
        document.querySelector(".ov-context-edit").style.display = "flex";
        document.querySelector(".ov-context-preview").style.display = "none";
      } else {
      }

      frame._$table = xs;
      window.xs = xs;

      xs.on("change", function (sheet) {
        w7.each(".btn-editor-save", function () {
          this.disabled = false;
        });
      });

      w7.each(".btn-editor-save", function () {
        this.onclick = function () {
          this.disabled = true;
          wuic.loading(true);
          const html = JSON.stringify(xs.getData());
          const blob = new Blob([html], { type: "application/json" });
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

      if (src) {
        w7.bearerScopeGet(src, {}, function (data) {
          xs.loadData(data);
        });
      } else {
        xs.loadData([
          {
            cols: {
              len: 12,
              2: { width: 100 },
            },
            rows: {
              len: 50,
            },
          },
        ]);
      }
    }, 100);

    if (c) {
      c.call();
    }
    //  return frame;

    if (!src) {
      setTimeout(function () {
        w7.editor(frame, "");
      }, 12);
      if (c) {
        c.call();
      }
    } else {
      var oReq = new XMLHttpRequest();
      oReq.addEventListener("load", function (a, b) {
        setTimeout(
          function (txt) {
            w7.editor(frame, txt);
          },
          222,
          this.responseText
        );
        if (c) {
          c.call();
        }
      });
      oReq.open("GET", src);
      oReq.send();
    }

    document.querySelector(".ov-context-preview").style.display = "none";
    document.querySelector(".ov-context-edit").style.display = "flex";
    return frame;
  },
  createEditNode: function (src, c) {
    var frame = document.createElement("div");
    frame.className = "richtext-editor-box";

    if (!src) {
      setTimeout(function () {
        w7.editor(frame, "");
      }, 12);
      if (c) {
        c.call();
      }
    } else {
      var oReq = new XMLHttpRequest();
      oReq.addEventListener("load", function (a, b) {
        setTimeout(
          function (txt) {
            w7.editor(frame, txt);
          },
          222,
          this.responseText
        );
        if (c) {
          c.call();
        }
      });
      oReq.open("GET", src);
      oReq.send();
    }

    document.querySelector(".ov-context-preview").style.display = "none";
    document.querySelector(".ov-context-edit").style.display = "flex";
    return frame;
  },
  createPreviewNode: function (src, versionObject, c) {
    var cantPreview = w7view.file.cantPreview(versionObject);
    if (cantPreview) {
      setTimeout(function () {
        if (c) {
          c.call();
        }
      }, 10);
      return cantPreview;
    }
    if (w7view.file.isCSV(versionObject)) {
      return this.previewCSV(src, c);
    } /*else if (w7view.file.isDoc(versionObject)) {
            return this.previewDoc(src, c)
        }*/

    var type = versionObject.ctype || versionObject.mimeType;
    var tag = this.createPreviewTag(type);
    var frame = document.createElement(tag);

    if (type.indexOf("pdf") !== -1) {
    }

    // src = '#98127126151891';

    const msDocs = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    const xls = [
      "application/vnd.ms-excel",
      "application/vnd.ms-excel",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
      "application/vnd.ms-excel.template.macroEnabled.12",
      "application/vnd.ms-excel.addin.macroEnabled.12",
      "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
    ];

    /*
            if(msDocs.includes(type)) {
                src = `/editors/document/index.html?src=${encodeURIComponent(src)}&type=${encodeURIComponent(type)}`;
            }

            if(xls.includes(type)) {
                src = `/editors/spreadsheet/index.html?src=${encodeURIComponent(src)}&type=${encodeURIComponent(type)}`;
            }
*/

    frame.src = src || "about:blank";
    frame.controls = true;
    frame.className = "object-preview-frame";
    if (tag === "pre" && !!src) {
      $.get(src, function (data) {
        var final = "" + data;
        var viewType = type.split("/")[1].toLowerCase();
        if (Prism.languages[viewType]) {
          final = Prism.highlight(final, Prism.languages[viewType], viewType);
        }
        frame.innerHTML = final;
        if (c) {
          c.call();
        }
      });
    }
    frame.onload = frame.oncanplay = function (ev) {
      if (c) {
        c.call(frame, tag);
      }
    };
    return frame;
  },
  createPreviewNodeBlob: function (blob, c) {
    var tag = blob.type.indexOf("image") !== -1 ? "img" : "iframe";

    var frame = document.createElement(tag);
    frame.src = URL.createObjectURL(blob);
    frame.className = "object-preview-frame";
    frame.onload = function (ev) {
      if (c) {
        c.call();
      }
    };
    return frame;
  },
  objectHasNoPreview: function () {
    const msg = `
            <div id="file-object--not-found"> 
            <h3>${w7.lang("Preview not available")}</h3>
 
            </div>
        `;
    document.getElementById("main-object-view").innerHTML = msg;
    document.querySelector(".ov-context-preview").remove();
  },
  fileObjectNotFound: function () {
    const msg = `
            <div id="file-object--not-found"> 
                <h3>${w7.lang("Object not found")}</h3>
            </div>
        `;
    try {
      document.getElementById("main-object-view").innerHTML = msg;
      document.querySelector(".ov-context-preview").remove();
      document.querySelector(".object-preview-data-tabs").remove();
      document.querySelector(".object-info-wtab").remove();
    } catch (e) {
      //todo: optimise
    }
  },
  fileObject: function (id, version, isPublic) {
    isPublic = isPublic === "public";

    w7.ajaxCBClear("*");
    w7.viewData = {};
    if (!id) return;
    var scope = this;
    $(".wui-object").show();
    $("#main-table-view").hide();
    $(".paging").hide();
    wuic.loading(true);
    $("#main-object-view").empty();
    wuic.preload(true, "#main-object-view");

    var xhr = w7.bearerScopeGet(
      w7.apiurl("/object/" + id),
      {},
      function (data) {
        w7.viewData = { context: data };
        scope.objectInfo(data, version);
        var vers =
          version ||
          data.versions.find(function (item) {
            return (
              item.action === "create" ||
              item.action === "reupload" ||
              item.action === "edit"
            );
          });
        var versId = vers.length ? vers : vers._id;
        var versionObject = data.versions.find(function (a) {
          return a._id === versId;
        });
        // var src = w7.objectPreviewURL(id, versionObject ? versionObject._id : undefined);
        w7.objectPreviewURLFromServer(
          id,
          versionObject ? versionObject._id : undefined,
          undefined,
          function (urlData) {
            var canEdit = location.pathname.indexOf("/edit") !== -1;
            var isText = false;
            var isSpreadsheet = false;
            isSpreadsheet = data.subtype === "spreadsheet";
            var isDocument = data.subtype === "document";
            var isBPMN = data.subtype === "bpmn";
            if (canEdit) {
              isText = data.mimeType.indexOf("text/") === 0;

              canEdit = isText || isSpreadsheet;
            }

            var url = urlData ? urlData.url : null;
            if (!url && !isSpreadsheet && !isDocument && !isBPMN) {
              // todo: move toseparate check
              w7view.files.objectHasNoPreview();

              wuic.loading(false);
              wuic.preload(false, "#main-object-view");
              return;
            }
            var node;
            if (isText) {
              node = scope.createEditNode(url, function () {
                wuic.loading(false);
                wuic.preload(false, "#main-object-view");
              });
            } else if (isBPMN) {
              node = scope.createBPMN(url, function () {
                wuic.loading(false);
                wuic.preload(false, "#main-object-view");
              });
            } else if (isSpreadsheet) {
              node = scope.createSpreadSheetEditNode(url, function () {
                wuic.loading(false);
                wuic.preload(false, "#main-object-view");
              });
            } else {
              node = scope.createPreviewNode(url, versionObject, function () {
                wuic.loading(false);
                wuic.preload(false, "#main-object-view");
              });
            }

            var vs = w7.el("div", { className: "main-object-view-side" });
            var title = w7.el("h2", {
              innerHTML: `
                            <span class="${scope.getFileIconClass(
                              data
                            )}"></span>
                            <object-hook class="data-hook-name object-title-text">${
                              data.name
                            }</object-hook>
                        `,
            });

            if (
              data.mimeType.indexOf("text/") === 0 ||
              data.subtype === "spreadsheet"
            ) {
              w7.ifCan("modifyObject", function (can) {
                if (can && !w7.is.edit()) {
                  var editBtn = w7.el("b", {
                    className:
                      "wui-btn wui-btn-outline edit-button-inside-title",
                    innerHTML:
                      '<span class="material-icons">edit_note</span> Edit',
                  });
                  title.append(editBtn);
                  editBtn.addEventListener("click", function () {
                    w7.service.goto("editCurrentObject");
                  });
                }
              });
            }

            const mov = $("#main-object-view");

            const ovWrapper = w7.el("div", {
              id: "object-view-header",
            });

            ovWrapper.append(title);
            ovWrapper.append(vs);

            mov
              .append(ovWrapper)

              .append(node);

            if (node.nodeName === "IMG") {
              //todo: zoom
              var zoomTpl = `
                        <div class="zoom-ctrls">
                            <span class="zoom-ctrls-minus"></span>
                            <input type="range" min="10" max="100" class="zoom-ctrls-slide"></input>
                            <span class="zoom-ctrls-plus"></span>
                        </div>
                     `;
            }

            w7.ifCan("modifyObject", function (can) {
              if (!can) return;
              var dropdown = new wuic.programaticDropdown({
                items: [
                  {
                    content: w7.lang("Protected"),
                    icon: "lock",
                    value: false,
                    description: "Object is accessible only by project users",
                  },
                  {
                    content: w7.lang("Public"),
                    icon: "lock_open",
                    value: true,
                    description: "Object is accessible for everyone",
                  },
                ],
                value: data.public,
                element: ".main-object-view-side",
                placeholderPrefix: w7.lang("Object is") + " ",
              });
              dropdown.onChange = function (data) {
                w7.view.file.public(data.value);
              };
            });

            if (node.nodeName === "VIDEO") {
              $(node)
                .addClass("video-js")
                .wrap('<div class="preview-video-holder" />');
              var vd = videojs(node, { fluid: true });

              setTimeout(function () {
                $(".vjs-play-control").on("click", function () {
                  if ($(this).hasClass("vjs-playing")) {
                    document
                      .querySelector(".preview-video-holder video")
                      .pause();
                  } else {
                    document
                      .querySelector(".preview-video-holder video")
                      .play();
                  }
                });
                $(".vjs-big-play-button").on("click", function () {
                  document.querySelector(".preview-video-holder video").play();
                });
                $(document.querySelector(".preview-video-holder video")).on(
                  "click",
                  function () {
                    if ($(this).parent().hasClass("vjs-paused")) {
                      document
                        .querySelector(".preview-video-holder video")
                        .play();
                    } else {
                      document
                        .querySelector(".preview-video-holder video")
                        .pause();
                    }
                  }
                );
              }, 100);
            }
          }
        );
      }
    );
    xhr.fail(function (xhr) {
      if (xhr.status === 404) {
        w7view.files.fileObjectNotFound();
      } else if (xhr.status === 403) {
        $(".main-grid-content").html("Object not fount");
        setPath("/404/");
      }
      wuic.preload(false, "#main-object-view");
      wuic.preload(false, "#tree-view");
    });
    if (!isPublic) {
      wuic.comments.init(id);
    }
  },
  getFileIconClass: function (obj) {
    var fileExt = obj.name.split(".").pop();
    if (obj.subtype === "spreadsheet") {
      return "icon-custom-spreadsheet";
    }
    if (obj.subtype === "department") {
      return "icon-department";
    }
    if (obj.type === "folder") {
      fileExt = "folder";
    }

    return "fiv-viv fiv-icon-" + fileExt;
  },
  createPaginator: function (obj, cls, cb) {
    cls = cls || "";
    var paginator = w7.el({
      className: "paging " + cls + " paging-empty-" + (obj.total === 0),
    });
    var path = "/" + location.pathname.replace(/^\/?|\/?$/g, "") + "?";
    var queryParams = new URLSearchParams(window.location.search);
    queryParams.delete("page");
    var q = queryParams.toString();

    if (!!q) {
      path += q + "&";
    }

    paginator.append(
      w7.el("span", {
        className: "paging-info",
        innerHTML:
          (obj.current - 1) * obj.perPage +
          1 +
          "-" +
          Math.min(obj.current * obj.perPage, obj.total) +
          " of " +
          obj.total,
      })
    );

    if (obj.current !== 1) {
      (function (p) {
        paginator.append(
          w7.el("a", {
            innerHTML: "arrow_back_ios_new",
            className: "paging-prev",
            href: path + "page=" + p,
            onclick: function (e) {
              cb ? cb(p) : setParam("page", p);
              e.preventDefault();
              return false;
            },
          })
        );
      })(obj.current - 1);
    }
    var i = obj.current - 2;
    if (i < 1) {
      i = 1;
    }
    var to = Math.min(obj.pages, i + 4);

    if (obj.current)
      for (; i <= to; i++) {
        (function (p) {
          var a = w7.el("a", {
            innerHTML: i,
            href: path + "page=" + i,
            onclick: function (e) {
              cb ? cb(p) : setParam("page", p);
              e.preventDefault();
              console.log(e);
              return false;
            },
          });
          if (p === obj.current) {
            a.className = "active";
          }
          paginator.appendChild(a);
        })(i);
      }
    if (obj.current !== obj.pages) {
      (function (p) {
        paginator.append(
          w7.el("a", {
            innerHTML: "arrow_forward_ios",
            className: "paging-next",
            href: path + "page=" + p,
            onclick: function (e) {
              cb ? cb(p) : setParam("page", p);
              e.preventDefault();
              return false;
            },
          })
        );
      })(obj.current + 1);
    }
    return paginator;
  },
  projectsView: function () {
    w7.pageTitle(w7.lang("Your Projects"));
    w7.ajaxCBClear("*");

    wuic.loading(true);
    wuic.preload(true, ".main-grid", true);
    w7.view.rend("projects", function () {
      w7.xhr.userCache(function (userData) {
        var xhrProjects = w7.bearerScopeGet(
          w7.apiurl("/projects"),
          {},
          function (projects) {
            // projects = []

            var root = $("body .view-projects");
            root.empty();

            var projectsHolder = $('<div class="projects-list-holder" />');

            if (projects.length) {
              $.each(projects, function () {
                var sc = this;
                var hasImg = this.image && this.image !== "false";
                var span = $(
                  '<span class="project-btn ' +
                    (hasImg
                      ? "project-btn-has-img"
                      : "project-btn-has-not-img") +
                    '" />'
                );
                span.html(
                  '<span class="project-btn-image" style=" ' +
                    (hasImg
                      ? "background-image: url(" +
                        w7.service.projectImagePath(this) +
                        ")"
                      : "") +
                    '"></span>'
                );
                span.on("click", function () {
                  goToProject(sc._id);
                });
                var desc = "";
                if (this.description) {
                  desc =
                    '<span class="project-btn-bottom-description">' +
                    this.description +
                    "</span>";
                }
                var pinfbottom = $(`
                                    <div class="project-btn-bottom">
                                         
                                        <span class="project-btn-bottom-title">${
                                          this.name
                                        }</span>
                                        ${desc}
                                        <br> ${w7.displayRoleForProject(sc)}
                                    </div>
                            `);

                var pinfbottomNav = document.createElement("div");
                pinfbottomNav.className = "project-btn-nav";

                span.append(pinfbottom);
                span.append(pinfbottomNav);

                w7.ifCan("$manageProject", undefined, sc._id, function (can) {
                  if (can) {
                    var settingsButton = $(
                      '<samp wtip="Project settings"><i class="material-icons">settings</i></samp>'
                    );
                    settingsButton.on("click", function (e) {
                      goToAdmin(undefined, sc._id);
                      e.stopPropagation();
                    });
                    var dashboardButton = $(
                      '<samp wtip="Dashboard"><svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M10,13H4a1,1,0,0,0-1,1v6a1,1,0,0,0,1,1h6a1,1,0,0,0,1-1V14A1,1,0,0,0,10,13ZM9,19H5V15H9ZM20,3H14a1,1,0,0,0-1,1v6a1,1,0,0,0,1,1h6a1,1,0,0,0,1-1V4A1,1,0,0,0,20,3ZM19,9H15V5h4Zm1,7H18V14a1,1,0,0,0-2,0v2H14a1,1,0,0,0,0,2h2v2a1,1,0,0,0,2,0V18h2a1,1,0,0,0,0-2ZM10,3H4A1,1,0,0,0,3,4v6a1,1,0,0,0,1,1h6a1,1,0,0,0,1-1V4A1,1,0,0,0,10,3ZM9,9H5V5H9Z"/></svg></samp>'
                    );
                    dashboardButton.on("click", function (e) {
                      w7.goToDashboard(sc._id);
                      e.stopPropagation();
                    });

                    pinfbottomNav.append(settingsButton[0]);
                    pinfbottomNav.append(dashboardButton[0]);
                  }
                });

                projectsHolder.append(span);
              });
            } else {
              var welcomeBlock = `
                            <span class="project-btn project-btn-welcome">
                                <span class="project-btn-image">
                                    <span class="project-btn-image-welcome">Welcome to projects section.</span>
                                    <span class="project-btn-image-welcome-info">Project is the main scope that holds all of your files and folders</span>
                                </span>
                                <span class="project-btn-bottom">

                                </span>
                            </span>`;
              projectsHolder.append(welcomeBlock).addClass("no-projects");
            }
            root.append(projectsHolder);

            w7.ifCan("$createProject", function (can) {
              const $rootTarget = projects.length
                ? ".page-title,.projects-list-holder"
                : ".project-btn-bottom";
              let abtn;
              if (can) {
                abtn = `
                                <span  class="project-btn" id="create-project-btn" onclick="w7.project.create()">
                                    <i class="material-icons" style="font-size: 37px;padding-bottom: 12px;">add</i> 
                                    <span>${w7.lang("Create Project")}</span>
                                </span>
                            `;
              } else if (!can && !projects.length) {
                abtn = `<a href="/billing" data-link="/billing" class="wui-btn wui-btn-prime" tabindex="2">${w7.lang(
                  "Purchase credits"
                )}</a>`;
              }

              $($rootTarget).append(abtn);
            });
            wuic.loading(false);
            wuic.preload(false, ".main-grid");
          }
        );
      });
    });
  },
  tblvMultiselect: function () {
    var ids = [],
      allchecked = true,
      indeterminate = false;
    w7.each(".wui-select-icon input", function () {
      var curr = this;
      while (curr) {
        curr = curr.parentElement;
        if (curr.nodeName === "TR") {
          break;
        }
      }
      curr.dataset.selected = this.checked;
      if (this.checked) {
        ids.push(this.value);
        indeterminate = true;
      } else {
        allchecked = false;
      }
    });
    w7.each('[data-action="refresh"]', function () {
      this.style.display = !ids.length ? "block" : "none";
    });
    w7.each(".view-files-multiselect-menu", function () {
      this.style.display = ids.length ? "block" : "none";
    });
    var selectallCheck = document.getElementById("selectall-check");

    selectallCheck.checked = allchecked;

    selectallCheck.indeterminate = indeterminate && !allchecked;
  },
  _tableViewActivated: false,
  tableView: function () {
    $("#main-table-viewno-results").hide();
    if (!$(".view-files-holder").length) {
      return;
    }
    w7.ajaxCBClear("*");

    wuic.loading(true);
    wuic.preload(true, "#main-table-view", true);
    if (
      !this._tableViewActivated &&
      $("#main-table-view [data-sort]").length > 0
    ) {
      this._tableViewActivated = true;
      $(document).on("click", "th[data-sort]", function () {
        var el = $(this);
        el.parent().find(".active").not(this).removeClass("active");
        el.addClass("active");
        if (el.hasClass("asc")) {
          el.removeClass("asc");
          el.addClass("desc");
          setParam("order_by", el.attr("data-sort"));
          setParam("order", "desc");
        } else {
          el.addClass("asc");
          el.removeClass("desc");
          setParam("order_by", el.attr("data-sort"));
          setParam("order", "asc");
        }
      });
    }
    var rootScope = this;
    $(".wui-object").hide();
    $("#main-table-view").show();
    var params = getParams();
    var folder = getFolder();
    var project = getProject();
    if (project) {
      params.project = project;
    }
    if (folder) {
      params.folder = folder;
    }

    var sh = $(".search-story").empty();

    if (params.type) {
      sh.append(
        '<span class="wui-param-display" data-param="type"><span>Type</span><span>' +
          params.type +
          "</span></span>"
      );
      $('.hs-advanced [name="type"]').val(params.type);
    }
    if (params.tags) {
      sh.append(
        '<span class="wui-param-display" data-param="tags"><span>Tags</span><span>' +
          params.tags +
          "</span></span>"
      );
      $('.hs-advanced [name="tags"]').val(params.tags);
    }
    if (params.size) {
      var paramSizeArray = params.size.split("-").map(function (a) {
        return a.trim();
      });
      if (paramSizeArray.length === 3) {
        var label =
          paramSizeArray[0] === "lt"
            ? "Smaller than"
            : paramSizeArray[0] === "gt"
            ? "Bigger than"
            : "";
        if (label) {
          sh.append(
            '<span class="wui-param-display" data-param="size"><span>' +
              label +
              "</span><span>" +
              paramSizeArray[1] +
              paramSizeArray[2] +
              "</span></span>"
          );
          $('.hs-advanced [name="size1"]').val(paramSizeArray[0]);
          $('.hs-advanced [name="size2"]').val(paramSizeArray[1]);
          $('.hs-advanced [name="size3"]').val(paramSizeArray[2]);
        } else {
          console.warn("Wrong size parameter: ", params.size);
          delete params.size;
        }
      } else {
        console.warn("Wrong size parameter: ", params.size);
        delete params.size;
      }
    }
    if (params.modified) {
      sh.append(
        '<span class="wui-param-display" data-param="modified"><span>Modified</span><span>' +
          $(
            '.hs-advanced [name="modified"] option[value="' +
              params.modified +
              '"]'
          ).html() +
          "</span></span>"
      );
      $('.hs-advanced [name="modified"]').val(params.modified);
    }

    if (params.find) {
      $('.header-search [name="search"]').val(params.find);
    }

    var allParams = document.querySelectorAll(".wui-param-display");

    for (var i = 0; i < allParams.length; i++) {
      var del = document.createElement("span");
      del.innerHTML = "close";
      del.setAttribute("wtip", lang("Remove"));
      del.className = "material-icons wui-param-display-remove";
      del.onclick = function () {
        this.parentNode.parentNode.removeChild(this.parentNode);
        removeQueryParam(this.parentNode.dataset.param);
      };
      allParams[i].appendChild(del);
    }

    params = $.param(params);

    $(".advanced-active").removeClass("advanced-active");

    var xhrProjects = w7.bearerScopeGet(
      w7.apiurl("/projects"),
      {},
      function (projects) {
        if (projects.length) {
          var all = $(".project-selector:empty");
          var project = getProject();
          $.each(projects, function () {
            var option = document.createElement("option");
            option.value = this._id;
            option.innerHTML = this.name;
            all.append(option);
          });

          all.val(project).on("change", function () {
            goToProject(this.value);
          });
          var xhr = w7.bearerScopeGet(
            w7.apiurl("/files?" + params),
            {},
            function (data) {
              w7.viewData = { context: data };

              var body = $("#table-view-body");
              body.empty();
              if (data.data.length === 0) {
                wuic.loading(false);
                wuic.preload(false, "#main-table-view");
                $("#main-table-view").hide();
                var searchVal;
                // needed in case of empty key
                var issearch = location.search
                  .replace("?", "")
                  .split("&")
                  .find(function (item) {
                    var is = item.indexOf("find=") !== -1;
                    if (is) {
                      searchVal = decodeURIComponent(
                        item.split("find=")[1].trim()
                      );
                    }
                    return is;
                  });

                let label;
                if (issearch) {
                  label =
                    lang("There are no objects matching your search") +
                    (searchVal ? ":&nbsp;<b>" + searchVal + "</b>" : "");
                } else {
                  label = lang("Folder is empty");
                }

                $("#main-table-viewno-results").show().html(label);
                return;
              } else {
                $("#main-table-viewno-results").hide();
                $("#main-table-view").show();
              }

              const qfind = new URLSearchParams(window.location.search).get(
                "find"
              );

              $.each(data.data, function () {
                var scope = this;
                var date = new Date(this.date);
                var pdate = userDate(date);

                var tr = $("<tr>");

                tr.append(
                  '<td class="wui-select-icon"><label class="wui-check"><input type="checkbox" value="' +
                    this._id +
                    '" name="tableViewCheck" oninput="w7view.files.tblvMultiselect()"></td>'
                );

                const starcell = document.createElement("td");
                starcell.className = "wui-cell-icon";

                const starBtn = document.createElement("span");
                starBtn.className = "il-star-btn";
                starBtn.setAttribute("wtip", "Add to favorites");
                starcell.appendChild(starBtn);

                starBtn.addEventListener("click", function () {
                  w7.xhr.star(scope._id, starBtn);
                });

                tr.append(starcell);
                tr.append(
                  '<td class="wui-cell-icon"></span><span class="' +
                    rootScope.getFileIconClass(this) +
                    ' the-file-icon"></span></td>'
                );
                var accessGroups =
                  this.accessGroups && this.accessGroups.length;
                var users = this.users && this.users.length;
                var typeRender =
                  this.type.charAt(0).toUpperCase() + this.type.slice(1);
                var accessIcon =
                  accessGroups || users
                    ? '<i class="material-icons table-title-prop" wtip="lang(' +
                      typeRender +
                      ' has limited access)">privacy_tip</i>'
                    : "";
                var afterName = "";
                // var afterName = '<i class="material-icons" wtip="lang('+typeRender+' has limited access)">forum</i>';
                const name = qfind
                  ? this.name.replace(new RegExp(qfind, "gi"), (f) => {
                      return `<strong>${f}</strong>`;
                    })
                  : this.name;

                tr.append(
                  '<td class="wui-cell-name">' +
                    accessIcon +
                    name +
                    afterName +
                    "</td>"
                );

                tr.append(
                  '<td class="wui-cell-author">' +
                    displayName(this.author) +
                    "</td>"
                );
                tr.append('<td class="wui-cell-date">' + pdate + "</td>");
                tr.append("<td>" + this.versions.length + "</td>");
                tr.append("<td>" + lang(this.public ? "yes" : "no") + "</td>");
                var optionsTd = $("<td>");
                var optionsDiv = $(
                  '<div class="wui-dropdown wui-dropdown-absolute"></div>'
                );

                optionsDiv.append(
                  '<button class="wui-btn-icon"><i class="material-icons">more_vert</i></button>'
                );
                optionsTd.append(optionsDiv);
                optionsDiv.append(optionsMenu());
                tr.append(optionsTd);
                var item = this;
                $("li", optionsDiv).each(function () {
                  this._$dataReflect = scope;
                });
                if (item.type === "folder") {
                  $(".a-object-upload-new-version", optionsDiv).remove();
                }
                if (item.subtype === "department") {
                  $(".a-object-copy", optionsDiv).remove();
                  $(".a-object-move", optionsDiv).remove();
                }
                $(".a-object-upload-new-version", optionsDiv).on(
                  "click",
                  function () {
                    w7.objects.uploadVersionDialog(item._id);
                  }
                );
                $(".a-object-manage-version", optionsDiv).on(
                  "click",
                  function () {
                    w7.objects.manageVersion(item);
                  }
                );

                $(".a-object-manage-access", optionsDiv).on(
                  "click",
                  function () {
                    w7.objects.manageAccess(item);
                  }
                );

                $(".a-object-rename", optionsDiv).on("click", function () {
                  w7.objects.renameObject(item);
                });
                $(".a-object-copy", optionsDiv).on("click", function () {
                  w7.objects.copyObject(item);
                });
                $(".a-object-move", optionsDiv).on("click", function () {
                  w7.objects.moveObject(item);
                });
                $(".a-object-delete", optionsDiv).on("click", function () {
                  w7.objects.delete(item);
                });
                (function (obj) {
                  $(tr).on("click", function (e) {
                    if (e.target.nodeName === "TD") {
                      var tp = obj.type === "folder" ? "folder" : "object";
                      if (scope.type === "folder") {
                        goToFolder(obj._id);
                      } else {
                        w7.ifCan("previewObject", obj, function (res) {
                          if (res) {
                            goToObject(obj._id);
                          }
                        });
                      }
                    }
                  });
                })(scope);
                body.append(tr);
              });
              wuic.run();

              $(".paging").remove();
              if (data.paging.pages > 1) {
                $("#main-table-view").after(
                  w7view.files.createPaginator(data.paging)
                );
                $(".context-root-menu").append(
                  w7view.files.createPaginator(data.paging, "paging-top")
                );
              }
              wuic.loading(false);
              wuic.preload(false, "#main-table-view");
            }
          );
          wuic.path.init("#path");
          w7.xhr._handle(xhr);
        } else {
          $("#main-table-view").html("no-projects");
        }
      }
    );
  },
};
