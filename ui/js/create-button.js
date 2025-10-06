class CreateButton {
  constructor(options) {
    this.render();
    this.init();
  }

  init() {
    document
      .querySelectorAll(".folder-add-section:not(.ready)")
      .forEach(function (el) {
        el.classList.add("ready");

        el.querySelector(".a-object-upload-new").addEventListener(
          "click",
          function () {
            w7.objects.uploader();
          }
        );

        el.querySelector(".a-object-new-document").addEventListener(
          "click",
          function () {
            w7.objects.object("document");
          }
        );

        el.querySelector(".a-object-new-folder").addEventListener(
          "click",
          function () {
            w7.objects.object();
          }
        );

        el.querySelector(".a-object-new-department").addEventListener(
          "click",
          function () {
            w7.objects.object("department");
          }
        );

        el.querySelector(".a-object-new-project").addEventListener(
          "click",
          function () {
            w7.project.create();
          }
        );
      });
  }

  render() {
    this.root = w7.el({
      className: "folder-add-section",
      dataset: {
        perm: "createObject",
      },
      content: [
        {
          className: "wui-dropdown",
          content: [
            {
              tag: "button",
              className: "wui-btn wui-btn-outline-prime",
              innerHTML: '<i class="material-icons">add</i>',
            },
            {
              tag: "ul",
              content: [
                {
                  tag: "li",
                  className: "a-object-upload-new",
                  dataset: { perm: "createObject" },
                  innerHTML:
                    '<i class="material-icons">cloud_upload</i> Upload file',
                  $ready: function (el) {
                    el.addEventListener("click", function () {
                      w7.objects.uploader();
                    });
                  },
                },
                /*{
                                    tag: 'li',
                                    className: 'a-object-upload-new',
                                    dataset: {perm: 'createObject'},
                                    innerHTML: '<i class="material-icons">cloud_upload</i> Upload file 2  <input type="file">',
                                    $ready: function (el) {
                                        el.addEventListener('click', function (){
                                            w7.objects.uploader()
                                        })
                                    }
                                },*/
                {
                  tag: "li",
                  className: "a-object-new-document",
                  dataset: { perm: "createObject" },
                  innerHTML:
                    '<i class="material-icons">description</i> Create Document',
                  $ready: function (el) {
                    el.addEventListener("click", function () {
                      w7.objects.object("document");
                    });
                  },
                },
                {
                  tag: "li",
                  className: "a-object-new-document",
                  dataset: { perm: "createObject" },
                  innerHTML:
                    '<span class="fiv-viv fiv-icon-xlsx" style="width: 42px;font-size: 20px;background-position: 9px;height: 20px;"></span> Create spreadsheet',
                  $ready: function (el) {
                    el.addEventListener("click", function () {
                      w7.objects.object("spreadsheet");
                    });
                  },
                },
                {
                  tag: "li",
                  className: "a-object-new-folder",
                  dataset: { perm: "createObject" },
                  innerHTML:
                    '<i class="material-icons">folder</i> Create Folder',
                  $ready: function (el) {
                    el.addEventListener("click", function () {
                      w7.objects.object();
                    });
                  },
                },
                {
                  tag: "li",
                  className: "a-object-new-department",
                  dataset: { perm: "createObject" },
                  innerHTML:
                    '<i class="material-icons">corporate_fare</i> Department',
                  $ready: function (el) {
                    el.addEventListener("click", function () {
                      w7.objects.object("department");
                    });
                  },
                },
                {
                  tag: "li",
                  className: "a-object-new-bpmn",
                  dataset: { perm: "createObject" },
                  innerHTML:
                    '<svg version="1.1" width="36" height="36" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="\n' +
                    "    width: 27px;\n" +
                    "    opacity: .66;\n" +
                    "    margin-inline-end: 15px;\n" +
                    '">\n' +
                    "    \n" +
                    '    <polygon points="9.8 18.8 26.2 18.8 26.2 21.88 27.8 21.88 27.8 17.2 18.8 17.2 18.8 14 17.2 14 17.2 17.2 8.2 17.2 8.2 21.88 9.8 21.88 9.8 18.8" class="clr-i-outline clr-i-outline-path-1"></polygon><path d="M14,23H4a2,2,0,0,0-2,2v6a2,2,0,0,0,2,2H14a2,2,0,0,0,2-2V25A2,2,0,0,0,14,23ZM4,31V25H14v6Z" class="clr-i-outline clr-i-outline-path-2"></path><path d="M32,23H22a2,2,0,0,0-2,2v6a2,2,0,0,0,2,2H32a2,2,0,0,0,2-2V25A2,2,0,0,0,32,23ZM22,31V25H32v6Z" class="clr-i-outline clr-i-outline-path-3"></path><path d="M13,13H23a2,2,0,0,0,2-2V5a2,2,0,0,0-2-2H13a2,2,0,0,0-2,2v6A2,2,0,0,0,13,13Zm0-8H23v6H13Z" class="clr-i-outline clr-i-outline-path-4"></path>\n' +
                    '    <rect x="0" y="0" width="36" height="36" fill-opacity="0"></rect>\n' +
                    "</svg> BPMN diagram",
                  $ready: function (el) {
                    el.addEventListener("click", function () {
                      // w7.objects.object('bpmn')
                      w7.objects.object("bpmn");
                    });
                  },
                },
                {
                  tag: "li",
                  className: "a-object-new-bpmn",
                  dataset: { perm: "createObject" },
                  innerHTML:
                    '<svg version="1.1" width="36" height="36" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="\n' +
                    "    width: 27px;\n" +
                    "    opacity: .66;\n" +
                    "    margin-inline-end: 15px;\n" +
                    '">\n' +
                    "    \n" +
                    '    <polygon points="9.8 18.8 26.2 18.8 26.2 21.88 27.8 21.88 27.8 17.2 18.8 17.2 18.8 14 17.2 14 17.2 17.2 8.2 17.2 8.2 21.88 9.8 21.88 9.8 18.8" class="clr-i-outline clr-i-outline-path-1"></polygon><path d="M14,23H4a2,2,0,0,0-2,2v6a2,2,0,0,0,2,2H14a2,2,0,0,0,2-2V25A2,2,0,0,0,14,23ZM4,31V25H14v6Z" class="clr-i-outline clr-i-outline-path-2"></path><path d="M32,23H22a2,2,0,0,0-2,2v6a2,2,0,0,0,2,2H32a2,2,0,0,0,2-2V25A2,2,0,0,0,32,23ZM22,31V25H32v6Z" class="clr-i-outline clr-i-outline-path-3"></path><path d="M13,13H23a2,2,0,0,0,2-2V5a2,2,0,0,0-2-2H13a2,2,0,0,0-2,2v6A2,2,0,0,0,13,13Zm0-8H23v6H13Z" class="clr-i-outline clr-i-outline-path-4"></path>\n' +
                    '    <rect x="0" y="0" width="36" height="36" fill-opacity="0"></rect>\n' +
                    "</svg> DMN diagram",
                  $ready: function (el) {
                    el.addEventListener("click", function () {
                      // w7.objects.object('bpmn')
                      w7.objects.object("bpmn");
                    });
                  },
                },
                {
                  tag: "li",
                  className: "a-object-new-screen-recording",
                  dataset: { perm: "createObject" },
                  innerHTML:
                    '<i class="material-icons"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9,6H5V10H7V8H9M19,10H17V12H15V14H19M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2" /></svg></i> Screen recording',
                  $ready: function (el) {
                    el.addEventListener("click", async function () {
                      let stream = await navigator.mediaDevices.getDisplayMedia(
                        {
                          video: true,
                        }
                      );

                      const mime = MediaRecorder.isTypeSupported(
                        "video/webm; codecs=vp9"
                      )
                        ? "video/webm; codecs=vp9"
                        : "video/webm";

                      let mediaRecorder = new MediaRecorder(stream, {
                        mimeType: mime,
                      });

                      let chunks = [];
                      mediaRecorder.addEventListener(
                        "dataavailable",
                        function (e) {
                          chunks.push(e.data);
                        }
                      );

                      mediaRecorder.addEventListener("stop", function () {
                        let blob = new Blob(chunks, {
                          type: chunks[0].type,
                        });
                        var file = new File(
                          [blob],
                          "Screen Recording - " +
                            new Date().toLocaleString() +
                            ".webm",
                          {
                            type: "video/webm",
                          }
                        );
                        var uploader = w7.objects.uploader();
                        uploader.uploadBox.listFiles.addFiles([file]);
                      });

                      //we have to start the recorder manually
                      mediaRecorder.start();
                    });
                  },
                },
              ],
            },
          ],
        },
      ],
    });
  }
}
