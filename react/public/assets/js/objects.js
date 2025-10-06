const needConvertAsDocument = (ext) => {
  const docs = [
    "xls",
    "xls5",
    "xls95",
    "xlt",
    "xlt5",
    "xlt95",
    "docx",
    "doc",
    "xls",
    "xlsx",
    "doc6",
    "ott",
    "sdw",
    "sdw4",
    "sdw3",
    "stw",
    "sxw",
    "vor",
    "vor4",
    "vor3",
    "eps",
    "odd",
    "otg",
    "pbm",
    "odt",
    "doc95",
    "rtf",
    "ppt",
    "pptx",
    "pts",
  ];
  return docs.indexOf(ext) !== -1;
};

const needConvertAsVideo = (ext) => {
  const ffmpegExtension = [
    "3dostr",
    "3g2",
    "3gp",
    "4xm",
    "a64",
    "aa",
    "aac",
    "aax",
    "ac3",
    "ace",
    "acm",
    "act",
    "adf",
    "adp",
    "ads",
    "adts",
    "adx",
    "aea",
    "afc",
    "aiff",
    "aix",
    "alaw",
    "alias_pix",
    "alp",
    "amr",
    "amrnb",
    "amrwb",
    "amv",
    "anm",
    "apc",
    "ape",
    "apm",
    "apng",
    "aptx",
    "DE aptx_hd",
    "D  aqtitle",
    "argo_asf",
    "argo_brp",
    "argo_cvg",
    "asf",
    "asf_o",
    "asf_stream",
    "ass",
    "ast",
    "au",
    "av1",
    "avi",
    "avisynth",
    "avm2",
    "avr",
    "avs",
    "avs2",
    "avs3",
    "bethsoftvid",
    "bfi",
    "bfstm",
    "bin",
    "bink",
    "binka",
    "bit",
    "bitpacked",
    "bmp_pipe",
    "bmv",
    "boa",
    "brender_pix",
    "brstm",
    "c93",
    "caca",
    "caf",
    "cavsvideo",
    "cdg",
    "cdxl",
    "chromaprint",
    "cine",
    "codec2",
    "codec2raw",
    "concat",
    "crc",
    "cri_pipe",
    "dash",
    "data",
    "daud",
    "dcstr",
    "dds_pipe",
    "derf",
    "dfa",
    "dhav",
    "dirac",
    "dnxhd",
    "dpx_pipe",
    "dsf",
    "dshow",
    "dsicin",
    "dss",
    "dts",
    "dtshd",
    "dv",
    "dvbsub",
    "dvbtxt",
    "dvd",
    "dxa",
    "ea",
    "ea_cdata",
    "eac3",
    "epaf",
    "exr_pipe",
    "f32be",
    "f32le",
    "f4v",
    "f64be",
    "f64le",
    "ffmetadata",
    "fifo",
    "fifo_test",
    "film_cpk",
    "filmstrip",
    "fits",
    "flac",
    "flic",
    "flv",
    "framecrc",
    "framehash",
    "framemd5",
    "frm",
    "fsb",
    "fwse",
    "g722",
    "g723_1",
    "g726",
    "g726le",
    "g729",
    "gdigrab",
    "gdv",
    "gem_pipe",
    "genh",
    "gif",
    "gif_pipe",
    "gsm",
    "gxf",
    "h261",
    "h263",
    "h264",
    "hash",
    "hca",
    "hcom",
    "hds",
    "hevc",
    "hls",
    "hnm",
    "ico",
    "idcin",
    "idf",
    "iff",
    "ifv",
    "ilbc",
    "image2",
    "image2pipe",
    "imf",
    "ingenient",
    "ipmovie",
    "ipod",
    "ipu",
    "ircam",
    "ismv",
    "iss",
    "iv8",
    "ivf",
    "ivr",
    "j2k_pipe",
    "jacosub",
    "jpeg_pipe",
    "jpegls_pipe",
    "jv",
    "kux",
    "kvag",
    "latm",
    "lavfi",
    "libcdio",
    "libgme",
    "libmodplug",
    "libopenmpt",
    "live_flv",
    "lmlm4",
    "loas",
    "lrc",
    "luodat",
    "lvf",
    "lxf",
    "m4v",
    "matroska",
    "matroska,webm",
    "mca",
    "mcc",
    "md5",
    "mgsts",
    "microdvd",
    "mjpeg",
    "mjpeg_2000",
    "mkv",
    "mlp",
    "mlv",
    "mm",
    "mmf",
    "mods",
    "moflex",
    "mov",
    "mov",
    "m4a",
    "3gp",
    "3g2",
    "mj2",
    "mp2",
    "mp3",
    "mp4",
    "mpc",
    "mpc8",
    "mpeg",
    "mpeg1video",
    "mpeg2video",
    "mpegts",
    "mpegtsraw",
    "mpegvideo",
    "mpjpeg",
    "mpl2",
    "mpsub",
    "msf",
    "msnwctcp",
    "msp",
    "mtaf",
    "mtv",
    "mulaw",
    "musx",
    "mv",
    "mvi",
    "mxf",
    "mxf_d10",
    "mxf_opatom",
    "mxg",
    "nc",
    "nistsphere",
    "nsp",
    "nsv",
    "null",
    "nut",
    "nuv",
    "obu",
    "oga",
    "ogg",
    "ogv",
    "oma",
    "opus",
    "paf",
    "pam_pipe",
    "pbm_pipe",
    "pcx_pipe",
    "pgm_pipe",
    "pgmyuv_pipe",
    "pgx_pipe",
    "photocd_pipe",
    "pictor_pipe",
    "pjs",
    "pmp",
    "png_pipe",
    "pp_bnk",
    "ppm_pipe",
    "psd_pipe",
    "psp",
    "psxstr",
    "pva",
    "pvf",
    "qcp",
    "qdraw_pipe",
    "r3d",
    "rawvideo",
    "realtext",
    "redspark",
    "rl2",
    "rm",
    "roq",
    "rpl",
    "rsd",
    "rso",
    "rtp",
    "rtp_mpegts",
    "rtsp",
    "s16be",
    "s16le",
    "s24be",
    "s24le",
    "s32be",
    "s32le",
    "s337m",
    "s8",
    "sami",
    "sap",
    "sbc",
    "sbg",
    "scc",
    "scd",
    "sdl,sdl2",
    "sdp",
    "sdr2",
    "sds",
    "sdx",
    "segment",
    "ser",
    "sga",
    "sgi_pipe",
    "shn",
    "siff",
    "simbiosis_imx",
    "sln",
    "smjpeg",
    "smk",
    "smoothstreaming",
    "smush",
    "sol",
    "sox",
    "spdif",
    "spx",
    "srt",
    "stl",
    "stream_segment,",
    "streamhash",
    "subviewer",
    "subviewer1",
    "sunrast_pipe",
    "sup",
    "svag",
    "svcd",
    "svg_pipe",
    "svs",
    "swf",
    "tak",
    "tedcaptions",
    "tee",
    "thp",
    "tiertexseq",
    "tiff_pipe",
    "tmv",
    "truehd",
    "tta",
    "ttml",
    "tty",
    "txd",
    "ty",
    "u16be",
    "u16le",
    "u24be",
    "u24le",
    "u32be",
    "u32le",
    "u8",
    "uncodedframecrc",
    "v210",
    "v210x",
    "vag",
    "vc1",
    "vc1test",
    "vcd",
    "vfwcap",
    "vidc",
    "vividas",
    "vivo",
    "vmd",
    "vob",
    "vobsub",
    "voc",
    "vpk",
    "vplayer",
    "vqf",
    "w64",
    "wav",
    "wc3movie",
    "webm",
    "webm_chunk",
    "webp",
    "webp_pipe",
    "webvtt",
    "wsaud",
    "wsd",
    "wsvqa",
    "wtv",
    "wv",
    "wve",
    "xa",
    "xbin",
    "xbm_pipe",
    "xmv",
    "xpm_pipe",
    "xvag",
    "xwd_pipe",
    "xwma",
    "yop",
    "yuv4mpegpipe",
  ];
  return ffmpegExtension.indexOf(ext) !== -1;
};

const needConvert = (ext) => {
  return needConvertAsDocument(ext) || needConvertAsVideo(ext);
};

w7.objects = {
  table: function (data, ths, opt) {
    opt = opt || {};
    if (!data || !data.length) {
      if (opt && opt.noData) {
        const block = document.createElement("div");
        block.className = `wui-component wui-table`;
        block.innerHTML = `<p class="empty-table-message">${opt.noData}</p>`;
        return block;
      }
    }
    var table = $('<table class="wui-component wui-table">');
    var thead = $("<thead>");
    var tbody = $("<tbody>");
    var theadtr = $("<tr>");
    thead.append(theadtr);
    table.append(thead);
    table.append(tbody);
    if (opt.index) {
      theadtr.append('<th width="30px"> </th>');
    }
    $.each(ths, function (key, val) {
      theadtr.append('<th width="' + val + '">' + key + "</th>");
    });
    var getHTML = function (key, val) {
      // val may be string or the object - which is rendered trough function
      var html = val;
      if (key === "date") {
        html = userDate(html) + "<br>" + userTime(html);
      } else if (typeof val === "object" && typeof opt[key] === "function") {
        html = opt[key](val);
      }
      return html;
    };

    var hasmenus = false;
    $.each(data, function (index) {
      var tr = $("<tr>");
      var curr = this;
      tr[0]._data = this;
      if (opt.index) {
        tr.append('<td width="30px">' + (index + 1) + "</td>");
      }
      $.each(ths, function (key, val) {
        var html = getHTML(key, curr[key] || curr);

        tr.append('<td width="' + val + '">' + html + "</td>");
      });
      var menuCase = !opt.menuCase || opt.menuCase(curr);

      if (opt.menu && menuCase) {
        hasmenus = true;
        var td = $('<td class="wui-table-menu-cell">');
        //td.append('<button class="wui-btn-icon"><i class="material-icons">more_vert</i></button>');
        var optionsDiv = $(
          '<div class="wui-dropdown wui-dropdown-absolute"></div>'
        );
        optionsDiv.append(
          '<button class="wui-btn-icon"><i class="material-icons">more_vert</i></button>'
        );
        optionsDiv.append('<ul class="object-context-menu "></ul>');

        td.append(optionsDiv);
        $.each(opt.menu, function () {
          var li = $("<li>");
          var action = this.action;
          li.on("click", function () {
            action.call(this, curr);
          });
          li.html(this.title);
          $(".object-context-menu", td).append(li);
        });
        tr.append(td);
      }
      tbody.append(tr);
    });

    if (hasmenus) {
      theadtr.append("<th> </th>");
      $("tbody tr, thead~tr", table).each(function () {
        if (this.querySelector(".wui-dropdown") === null) {
          $(this).append("<td></td>");
        }
      });
    }
    setTimeout(function () {
      wuic.run();
    }, 10);
    return table;
  },
  manageAccess: function (item) {
    var footer = w7.modalFooter();

    var modal = new w7.modal({
      content: $(".tpl-manageAccess").html(),
      title: lang("Manage Access"),
      width: 600,
      height: "auto",
      footer: footer.footer,
      vAlign: "top",
    });
    wuic.preload(true, modal.modalContainer);

    $("select.wui-field", modal.modalContainer).on("input", function () {
      var val = $(this).val();
      if (val === "custom") {
        $(".project-users-selector-holder", modal.modalContainer).show();
      } else {
        $(".project-users-selector-holder", modal.modalContainer).hide();
      }
    });
    var path =
      "/object-access-data/object/" + item._id + "/project/" + getProject();
    var xhr = w7.bearerScopeGet(w7.apiurl(path), function (data) {
      if (
        (data.users && data.users.length) ||
        (data.objectAccessGroups && data.objectAccessGroups.length) ||
        (data.objectUsers && data.objectUsers.length)
      ) {
        $("select.wui-field", modal.modalContainer).val("custom");
        $(".project-users-selector-holder", modal.modalContainer).show();
      }

      var usersHtml = [];
      var groupsHtml = [];

      $.each(data.project.users, function () {
        var check =
          '<label class="wui-check"><input ' +
          (data.objectUsers.indexOf(this._id) !== -1 ? "checked" : "") +
          ' type="checkbox" name="users" value="' +
          this._id +
          ' "><span>' +
          w7.displayName(this) +
          "</span></label>";
        usersHtml.push(check);
      });
      $.each(data.accessGroups, function () {
        var check =
          '<label class="wui-check"><input ' +
          (data.objectAccessGroups.indexOf(this._id) !== -1 ? "checked" : "") +
          ' type="checkbox" name="users" value="' +
          this._id +
          ' "><span>' +
          w7.displayName(this) +
          "</span></label>";
        groupsHtml.push(check);
      });

      $("#wui-list-box-project-users", modal.modalContainer).html(
        usersHtml.join("")
      );
      $("#wui-list-box-project-groups", modal.modalContainer).html(
        groupsHtml.join("")
      );

      $("select.wui-field", modal.modalContainer).show();

      wuic.run();

      wuic.preload(false, modal.modalContainer);
    });

    footer.ok.innerHTML = lang("Save");
    footer.cancel.onclick = function () {
      modal.remove();
    };
    footer.ok.onclick = function () {
      var users = [];
      var accessGroups = [];
      $("#wui-list-box-project-users input:checked").each(function () {
        users.push(this.value);
      });
      $("#wui-list-box-project-groups input:checked").each(function () {
        accessGroups.push(this.value);
      });
      var final = {
        type: $("select.wui-field", modal.modalContainer).val(),
        users: users.join(","),
        accessGroups: accessGroups.join(","),
      };
      wuic.preload(true, modal.modalContainer);
      var xhr = w7.bearerPost(
        w7.apiurl(
          "/object-access-data/object/" + item._id + "/project/" + getProject()
        ),
        final,
        function () {
          wuic.notify(lang("Object updated"));
          wuic.preload(false, modal.modalContainer);
          tableView();
        }
      );
      xhr.always(function () {
        modal.remove();
      });
    };
  },
  manageVersion: function (item) {
    var footer = w7.modalFooter();

    var modal = new w7.modal({
      content: $(".tpl-manage-version").html(),
      title: lang("Manage Versions"),
      width: 800,
      height: "auto",
      footer: footer.footer,
    });
    modal.modalHolder.style.maxHeight = "85vh";
    footer.ok.innerHTML = lang("Done");
    footer.ok.onclick = function () {
      modal.destroy();
    };
    footer.cancel.style.display = "none";

    w7.bearerGet(w7.apiurl("/object_versions"), { id: item._id }).done(
      function (data) {
        var table = w7.objects.table(
          data,
          {
            name: "auto",
            type: "auto",
            author: "120px",
            action: "120px",
            date: "120px",
          },
          {
            index: true,
            author: function (obj) {
              return displayName(obj);
            },
            menuCase: function (curr) {
              return (
                curr.type !== "folder" &&
                (curr.action === "reupload" || curr.action === "create")
              );
            },
            menu: [
              {
                title: lang("View"),
                action: function (curr) {
                  goToObject(item._id, curr._id);
                  modal.destroy();
                },
              },
              {
                title: lang("Download"),
                action: function (curr) {
                  var link = $("<a>");
                  var src = w7.objectDownloadURL(item._id, curr._id);

                  link
                    .attr("href", src)
                    .html(curr.name)
                    .attr("download", curr.name);
                  $(document.body).append(link);
                  link[0].click();
                  setTimeout(function () {
                    link.remove();
                  }, 10);

                  // modal.destroy()
                },
              },
            ],
          }
        );
        $(modal.modalContainer).append(table);
      }
    );
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

  uploadFile: function (obj) {
    if (!obj.project) {
      return;
    }
    var file = obj.file,
      folder = obj.folder || getFolder(),
      done = obj.done,
      onChunk = obj.onChunk;
    var data = new FormData();
    data.append("file", obj.file);
    data.append("project", obj.project);
    if (obj.folder) {
      data.append("folder", obj.folder);
    }
    data.append("type", obj.file.type);
    data.append("name", obj.file.name);

    if (file) {
      /*w7.bearerUploadPost(w7.apiurl('/upload-object'), data)
                .done(function () {
                    if(done) done.call()
                })*/
      var up = new w7.Uploader(obj.file, obj.folder, obj.project);
      up.upload(
        function () {
          if (done) done.call();
        },
        function (data) {
          if (onChunk) onChunk.call(undefined, data);
        }
      );
    }
  },
  uploadVersion: function (obj) {
    var file = obj.file,
      folder = obj.folder || getFolder(),
      done = obj.done;
    var data = new FormData();
    data.append("file", obj.file);
    if (obj.folder) {
      data.append("folder", obj.folder);
    }
    if (obj.action) {
      data.append("action", obj.action);
    }
    data.append("type", obj.file.type);
    data.append("name", obj.file.name);

    if (file) {
      /*w7.bearerUploadPost(w7.apiurl('/upload-version/') + obj.id, data)
                .done(function () {
                    if(done)done.call()
                })*/

      var up = new w7.Uploader(file, folder, getProject(), {
        type: "modifyObject",
        objectId: obj.id,
        action: obj.action,
      });
      up.upload(
        function () {
          if (done) done.call();
        },
        function (data) {
          console.log(data);
        }
      );
    }
  },
  copyObject: function (obj) {
    var footer = w7.modalFooter();

    var modal = new w7.modal({
      content: "",
      footer: footer.footer,
      title: lang("Select target folder"),
      height: "auto",
    });
    var activet = null;
    var tree = new wuic.Tree({
      projectSwitcher: false,
      element: modal.modalContainer,
      onSelect: function (data) {
        footer.ok.disabled = !data;
        activet = data;
      },
      onProjectSelect: function (data) {
        footer.ok.disabled = !data;
        activet = data;
      },
      onProjectSwitch: function () {
        footer.ok.disabled = true;
        activet = null;
      },
      skip: [obj._id],
    });
    footer.ok.disabled = true;

    $(footer.cancel).on("click", function () {
      modal.remove();
    });

    function doCopy(toSend, donec) {
      footer.ok.disabled = true;
      var xhr = w7.bearerPost(w7.apiurl("/copy"), toSend, function (data) {
        donec.call(data);
      });
      wuic.loading(true);
      xhr.fail(function (req) {
        if (req.responseJSON) {
          var js = req.responseJSON;
          if (js.code === "objectExists" && js.data) {
            w7.nameConflictDialog(js.data, function (res) {
              doCopy($.extend(toSend, res), donec);
            });
          }
        }
      });
    }

    $(footer.ok).on("click", function () {
      var to = activet.type === "folder" ? activet._id : null;

      if (activet) {
        var toSend = {
          what: obj._id,
          fromproject: obj.project._id ? obj.project._id : obj.project,
          to: to,
          // toproject: activet.project || activet._id
        };
        doCopy(toSend, function () {
          modal.remove();
          wuic.treeView.reload();
          wuic.loading(false);
          tableView();
        });
      }
    });
  },
  moveObject: function (obj) {
    var footer = w7.modalFooter();

    var modal = new w7.modal({
      content: "",
      footer: footer.footer,
      title: lang("Select target folder"),
      height: "auto",
    });
    var activet = null;
    var tree = new wuic.Tree({
      projectSwitcher: false,
      element: modal.modalContainer,
      onSelect: function (data) {
        footer.ok.disabled = !data;
        activet = data;
      },
      onProjectSelect: function (data) {
        footer.ok.disabled = !data;
        activet = data;
      },
      onProjectSwitch: function () {
        footer.ok.disabled = true;
        activet = null;
      },
      skip: [obj._id],
    });
    footer.ok.disabled = true;

    $(footer.cancel).on("click", function () {
      modal.remove();
    });

    function doCopy(toSend, donec) {
      footer.ok.disabled = true;
      var xhr = w7.bearerPost(w7.apiurl("/move"), toSend, function (data) {
        donec.call(data);
      });
      wuic.loading(true);
      xhr.fail(function (req) {
        if (req.responseJSON) {
          var js = req.responseJSON;
          if (js.code === "objectExists" && js.data) {
            w7.nameConflictDialog(js.data, function (res) {
              doCopy($.extend(toSend, res), donec);
            });
          }
        }
      });
    }

    $(footer.ok).on("click", function () {
      var to = activet.type === "folder" ? activet._id : null;
      if (activet) {
        var toSend = {
          what: obj._id,
          fromproject: obj.project,
          to: to,
          // toproject: activet.project || activet._id
        };
        wuic.loading(true);
        doCopy(toSend, function () {
          modal.remove();
          wuic.treeView.reload();
          wuic.loading(false);
          tableView();
        });
      }
    });
  },
  renameObject: function (obj) {
    var footer = w7.modalFooter();

    var modal = new w7.modal({
      content: $(".tpl-folder").html(),
      footer: footer.footer,
      title: lang("Rename object"),
      height: 100,
    });

    var _validateTime = null;
    var _validate = function (c) {
      clearTimeout(_validateTime);
      _validateTime = setTimeout(function () {
        var name = $("#folder-name").val().trim();
        var isValid = w7.objects.folderNameValid(name);
        if (isValid) {
          w7.objects.validName(name, getFolder(), function (valid) {
            $(footer.ok)[isValid && valid ? "removeAttr" : "attr"](
              "disabled",
              ""
            );
            if (c) {
              c.call(undefined, isValid && valid);
            }
          });
        }
      }, 555);
    };
    _validate();

    $("input", modal.modalContainer)
      .val(obj.name)
      .on("input", function () {
        var val = this.value.trim();
        $(footer.ok).attr("disabled", true);
        if (val === obj.name) {
          return;
        }
        _validate();
      });
    $(footer.cancel).on("click", function () {
      modal.remove();
    });
    $(footer.ok)
      .attr("disabled", true)
      .html(lang("Rename"))
      .on("click", function () {
        var name = $("#folder-name").val().trim();
        $(footer.ok).attr("disabled", true);
        var xhr = w7.bearerPost(w7.apiurl("/rename"), {
          name: name,
          id: obj._id,
        });
        wuic.loading(true);
        xhr.done(function (res) {
          modal.remove();
          wuic.loading(false);
          tableView();
          w7.each(
            ".data-hook-name, #path-item-" +
              res._id +
              ' .wui-btn-icon, [data-id="' +
              res._id +
              '"] > .tree-item-content .tree-folder-title-content',
            function () {
              this.innerHTML = res.name;
            }
          );
        });
        return xhr;
      });
  },
  createFolder: function (data) {
    return w7.bearerPost(w7.apiurl("/object"), {
      name: data.name,
      type: "folder",
      folder: data.folder,
      project: data.project,
      subtype: data.subtype,
    });
  },
  uploader: function (files) {
    var footer = w7.modalFooter();
    var modal = new w7.modal({
      content: $(".tpl-file").html(),
      footer: footer.footer,
      title: lang("Upload file"),
      height: "auto",
    });

    $(modal.modalHolder).on("UploadProgress", function (e, progressEvt) {
      console.log(
        "Uploaded :: " +
          parseInt((progressEvt.loaded * 100) / progressEvt.total) +
          "%"
      );
    });
    footer.cancel.onclick = function () {
      modal.remove();
    };
    var upBox = $(".upload-box", modal.modalContainer)[0];
    var upList = $(".upload-box-list", modal.modalContainer)[0];
    var up = new wuic.uploadBox({
      box: upBox,
      list: upList,
    });

    var folder = getFolder();
    var names = [];
    var validateFilesNames = function () {
      if (names.length === 0) {
        footer.ok.disabled = true;
        return;
      }
      w7.bearerPost(
        w7.apiurl("/validnames"),
        { names: names, folder: folder, project: getProject() },
        function (data) {
          $(".files-row .error").empty();
          if (data.result === false) {
            footer.ok.disabled = true;
            data.data.forEach(function (item) {
              $(".files-row [contenteditable]").each(function () {
                if ($(this).text() === item) {
                  $(this)
                    .next()
                    .html(
                      lang(
                        "Object with this name already exists in this folder"
                      )
                    );
                }
              });
            });
          } else {
            footer.ok.disabled = false;
          }
        }
      );
    };
    $(up).on("change", function (e, fls) {
      names = [];
      footer.ok.disabled = true;
      if (!fls.length) return;
      $.each(fls, function (i, item) {
        names.push(this.name);
      });
      var duplicates = [];
      $.each(names, function (i, item) {
        if (names.indexOf(item) !== i) {
          duplicates.push(item);
        }
      });
      if (duplicates.length) {
        $.each(duplicates, function (i, item) {
          $(".files-row [contenteditable]").each(function () {
            if ($(this).text() === item) {
              $(this).next().html(lang("Duplicate name"));
            }
          });
        });

        return;
      }
      validateFilesNames();
    });

    this.targetFolderPicker(
      modal.modalContainer.querySelector(".wui-component"),
      function (data) {
        folder = data._id !== getProject() ? data._id : null;
        validateFilesNames();
      }
    );
    footer.ok.disabled = true;
    footer.ok.innerHTML = lang("Upload");
    footer.ok.onclick = function () {
      var project = getProject();
      if (up.value.length) {
        wuic.loading(true);
        wuic.preload(true, modal.modalContainer, "rgba(0,0,0,0)");
        $(".upload-box-list-delete-cell-button").hide();
        var done = 0;
        $(modal.modalHolder).addClass("uploading");
        footer.ok.disabled = true;
        footer.cancel.disabled = true;

        var uploderType = "multipart"; // s3 | multipart | s3convertable;

        var completeHandle = function () {
          modal.remove();
          wuic.loading(false);
          wuic.notify(
            lang("File" + (up.value.length === 1 ? "" : "s") + " uploaded")
          );
          tableView();
        };

        up.value.forEach(function (file, i) {
          let _uplodType = uploderType;
          var ext = file.name.split(".").pop();
          if (uploderType === "s3convertable") {
            if (needConvert(ext)) {
              _uplodType = "multipart";
            } else {
              _uplodType = "s3";
            }
          }
          if (_uplodType === "s3") {
            var s3Uploader = new w7.S3Uploader(file);
            s3Uploader._i = i;
            s3Uploader.upload(function (data) {
              done++;
              if (done === up.value.length) {
                completeHandle();
              }
              up.progress(100, s3Uploader._i);
            });
            up.progress(5, s3Uploader._i);
            s3Uploader.on("progress", function (data) {
              var val = data.percent;
              if (val > 95) {
                val = 95;
              }
              up.progress(val, s3Uploader._i);
            });
          } else if (_uplodType === "multipart") {
            w7.objects.uploadFile({
              file: file,
              folder: folder,
              project: project,
              onChunk: function (data) {
                console.log(data);
              },
              done: function () {
                done++;
                if (done === up.value.length) {
                  completeHandle();
                }
              },
            });
          }
        });
      }
      //modal.remove();
    };
    if (files && files.length) {
      names = [];
      up.listFiles.addFiles(files);
      for (var i = 0; i < files.length; i++) {
        names.push(files[i].name);
      }
      up.filesClass();

      up.value = Array.from(files);

      validateFilesNames();
    }
    return {
      uploadBox: up,
    };
  },
  uploadVersionDialog: function (objectID) {
    var footer = w7.modalFooter();
    var modal = new w7.modal({
      content: $(".tpl-file").html(),
      footer: footer.footer,
      title: lang("Upload version"),
    });

    $(modal.modalHolder).on("UploadProgress", function (e, progressEvt) {
      console.log(
        "Uploaded :: " +
          parseInt((progressEvt.loaded * 100) / progressEvt.total) +
          "%"
      );
    });
    //console.log("Uploaded :: " + parseInt((progressEvt.loaded * 100) / progressEvt.total)+'%');
    footer.cancel.onclick = function () {
      modal.remove();
    };
    var upBox = $(".upload-box", modal.modalContainer)[0];
    var upList = $(".upload-box-list", modal.modalContainer)[0];
    var up = new wuic.uploadBox({
      box: upBox,
      list: upList,
      multiple: false,
    });
    $(up).on("change", function (e, fls) {
      var names = [];
      footer.ok.disabled = true;
      if (!fls.length) return;
      footer.ok.disabled = false;
      $.each(fls, function () {
        names.push(this.name);
      });
    });
    footer.ok.disabled = true;
    footer.ok.innerHTML = lang("Upload");
    footer.ok.onclick = function () {
      var folder = getFolder();
      if (up.value.length) {
        wuic.loading(true);
        wuic.preload(true, modal.modalContainer, true);
        $(".upload-box-list-delete-cell").empty();
        var done = 0;
        $(modal.modalHolder).addClass("uploading");
        footer.ok.disabled = true;
        footer.cancel.disabled = true;
        up.value.forEach(function (file, index) {
          w7.objects.uploadVersion({
            file: file,
            id: objectID,
            folder: folder,
            done: function () {
              done++;
              if (done === up.value.length) {
                modal.remove();
                wuic.loading(false);
                wuic.notify(
                  lang(
                    "Object" + (up.value.length === 1 ? "" : "s") + " uploaded"
                  )
                );
                var objID = getObject();
                if (objID) {
                  objectView(objID);
                } else {
                  tableView();
                }
              }
            },
          });
        });
      }
      //modal.remove();
    };
  },
  folderNameValid: function (name) {
    name = (name || "").trim();
    if (!name) return false;
    return true;
  },
  targetFolderPicker: function (holder, onSelect) {
    var active = wuic.treeView.selected();
    var targetSelector = document.createElement("div");
    targetSelector.innerHTML =
      '<span>Parent folder: </span> &nbsp;<b class="wui-btn wui-btn-outline">' +
      active.name +
      "</b>";
    targetSelector.className = "wui-targetFoldertargetSelector";

    var targetSelectorTree = document.createElement("div");
    targetSelectorTree.className = "wui-targetFolderPicker";
    targetSelectorTree.style.padding = "10px";

    holder.prepend(targetSelectorTree);
    holder.prepend(targetSelector);

    var tree;

    targetSelector.onclick = function () {
      if (!tree) {
        tree = new wuic.Tree({
          projectSwitcher: false,
          element: targetSelectorTree,
          onSelect: function (data) {
            targetSelector.querySelector("b").innerHTML = data.name;
            active = data;
            onSelect.call(undefined, active);
          },
          onProjectSelect: function (data) {
            targetSelector.querySelector("b").innerHTML = data.name;
            active = data;
            onSelect.call(undefined, active);
          },
        });
      } else {
        tree.toggle();
      }
    };
  },
  object: function (type) {
    type = type || "folder";
    var isdep = type === "department";
    var isdoc = type === "document";
    var isbpmn = type === "bpmn";
    var isSheet = type === "spreadsheet";
    var footer = w7.modalFooter();
    var title;
    if (type === "folder") {
      title = lang("Create folder");
    } else if (isbpmn) {
      title = lang("Create BPMN diagram");
    } else if (isdep) {
      title = lang("Create department");
    } else if (isdoc) {
      title = lang("Create document");
    } else if (isSheet) {
      title = lang("Create spreadsheet");
    }
    var modal = new w7.modal({
      content: document.querySelector(".tpl-folder").innerHTML,
      height: "auto",
      footer: footer.footer,
      title: title,
    });

    var holder = modal.modalContainer.querySelector(".wui-component");
    var active;
    if (!isdep) {
      active = wuic.treeView.selected();
      if (active && active.type === "project") {
        active = null;
      }
      this.targetFolderPicker(holder, function (data) {
        active = data;
        if (active && active.type === "project") {
          active = null;
        }
        _validate(undefined, active);
      });
    } else {
      active = wuic.treeView.project();
    }

    footer.cancel.onclick = function () {
      modal.remove();
    };
    $(footer.ok).html(lang("Create")).attr("disabled", true);
    footer.ok.onclick = function () {
      wuic.loading(true);
      var name = document.getElementById("folder-name").value;
      if (active) {
        if (active._id !== getProject()) {
          active = active._id;
        } else {
          active = null;
        }
      }
      w7.objects
        .createFolder({
          name: name,
          folder: active,
          project: getProject(),
          subtype: type,
        })
        .done(function (data) {
          /*
                wuic.treeView.reload();
                var selected = wuic.treeView.selected()
                wuic.treeView.get(selected._id, function() {
                    var li = wuic.treeView.element.querySelector('li[data-id="'+selected._id+'"]');
                    wuic.treeView.render(li, this);
                    if(!selected.hasChildren) {
                       wuic.treeView._addOpener(li, true)

                    }
                    w7view.files.view();
                });*/
          wuic.treeView.refreshFolder(active);

          wuic.loading(false);
          if (type === "document") {
            w7.editDocument(data._id);
          }
          if (type === "spreadsheet") {
            w7.editDocument(data._id);
          }
        });
      modal.remove();
      tableView();
    };
    var _validateTime = null;
    var _validate = function (c, folder) {
      footer.ok.disabled = true;
      clearTimeout(_validateTime);
      _validateTime = setTimeout(function () {
        var name = $("#folder-name").val().trim();
        var isValid = w7.objects.folderNameValid(name);
        if (isValid) {
          var targetFolder = !isdep ? folder || getFolder() : null;
          if (!!targetFolder && typeof targetFolder === "object") {
            targetFolder = targetFolder._id;
          }
          w7.objects.validName(name, targetFolder, function (valid) {
            $(footer.ok)[isValid && valid ? "removeAttr" : "attr"](
              "disabled",
              ""
            );
            if (!valid) {
              if (targetFolder) {
                wuic.warn(
                  lang("Object with such name already exists in target folder")
                );
              } else {
                wuic.warn(lang("Object with such name already exists"));
              }
            }
            if (c) {
              c.call(undefined, isValid && valid);
            }
          });
        }
      }, 333);
    };
    _validate();

    $("#folder-name").on("input", function (e) {
      $(footer.ok).attr("disabled", true);
      _validate();
      if (e.keyCode === 13) {
        _validate(function (valid) {
          if (valid) {
            $(footer.ok).trigger("click");
          } else {
            wuic.warn(lang("Object with such name already exists"));
          }
        });
      }
    });
  },
  delete: function (item) {
    // permanently delete
    w7.confirm(
      lang("Are you sure you want to <b>permanently</b> delete") +
        "<br><b>" +
        item.name +
        "</b>",
      function () {
        wuic.loading(true);
        w7.bearerDelete(w7.apiurl("/object/" + item._id)).done(function () {
          tableView();
          wuic.loading(false);
          wuic.treeView.reload("#view-tree");
        });
      }
    );
  },
  deleteMany: function (ids) {
    w7.confirm(
      lang(
        "Are you sure you want to <b>permanently</b> delete selected objects"
      ),
      function () {
        wuic.loading(true);
        w7.bearerPost(w7.apiurl("/delete-objects"), { ids: ids }).done(
          function () {
            tableView();
            wuic.loading(false);
            wuic.treeView.reload("#view-tree");
          }
        );
      }
    );
  },
  trash: function (item) {
    // permanently delete
    w7.confirm(
      lang("Are you sure you want to <b>permanently</b> delete") +
        "<br><b>" +
        item.name +
        "</b>",
      function () {
        wuic.loading(true);
        w7.bearerDelete(w7.apiurl("/object/" + item._id)).done(function () {
          tableView();
          wuic.loading(false);
          wuic.treeView.reload("#view-tree");
        });
      }
    );
  },
  trashMany: function (ids) {
    w7.confirm(
      lang("Are you sure you want to delete selected objects"),
      function () {
        wuic.loading(true);
        w7.bearerPost(w7.apiurl("/delete-objects"), { ids: ids }).done(
          function () {
            tableView();
            wuic.loading(false);
            wuic.treeView.reload("#view-tree");
          }
        );
      }
    );
  },
  validName: function (name, folder, c, project) {
    w7.bearerPost(w7.apiurl("/validname"), {
      name: name,
      folder: folder,
      project: project || getProject(),
    }).done(function (data) {
      if (c) c.call(undefined, data);
    });
  },
  renameFile: function (file, name) {
    var blob = file.slice(0, file.size, file.type);
    var newFile = new File([blob], name, { type: file.type });
    return newFile;
  },
};
