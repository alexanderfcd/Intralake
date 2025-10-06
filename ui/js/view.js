var __currentView = null;
il.hideViews = function () {
  var all = document.querySelectorAll("[data-view]"),
    i = 0,
    l = all.length;
  for (; i < l; i++) {
    while (all[i].lastChild) all[i].removeChild(all[i].lastChild);
  }
};
var _loadViews = {};

const viewReady = function (options) {
  setTimeout(function () {
    // il.templateRenderer.parseHooks();
  }, 78);
};

il.view = async function (options) {
  var scripts = function (el) {
    setTimeout(function () {
      Array.from(el.querySelectorAll("script:not([src])")).forEach(function (
        script
      ) {
        if (!!script.innerText.trim()) {
          new Function(script.innerText)();
        }
      });
    });
  };
  var loadViewPrepare = function (html, cb) {
    var el = document.createElement("div");
    el.innerHTML = html;

    var all = Array.from(el.querySelectorAll("[data-include]")),
      count = 0;
    if (all.length === 0) {
      cb.call(undefined, el.innerHTML);
    }
    all.forEach(function (node) {
      var url = node.dataset.include.trim();
      loadViewUrl(url, function (html) {
        count++;
        node.innerHTML = html;
        if (count === all.length) {
          cb.call(undefined, el.innerHTML);
        }
      });
      delete node.dataset.url;
    });
    scripts(el);
  };
  var loadViewUrl = function (url, cb) {
    if (_loadViews[url]) {
      loadViewPrepare(_loadViews[url], function (html) {
        cb.call(undefined, html);
      });
    } else {
      il.ajax({
        url: url,
        method: "GET",
        responseType: "text",
      }).on("success", function (response) {
        loadViewPrepare(response.data, function (html) {
          _loadViews[url] = html;
          cb.call(undefined, html);
        });
      });
    }
  };

  if (typeof options.forced === "undefined") {
    options.forced = true;
  }
  var view = options.view || "app";
  var source = options.source;
  var forced = options.forced;

  var viewEl = document.querySelector('[data-view="' + view + '"]');
  var deepView = (viewEl || document).querySelector(".deep-view");

  if (options.beforeRender) {
    options.beforeRender(viewEl);
    wuic.run();
  }

  if (__currentView !== view || forced || deepView) {
    if (options.guard) {
      const _canAccess = await options.guard();
      if (!_canAccess) {
        return;
      }
    }
    if (__currentView !== view) {
      il.hideViews();
    }
    __currentView = view;

    if (viewEl) {
      if (options.beforeController) {
        options.beforeController(viewEl);
        wuic.run();
      }

      viewEl = deepView || viewEl;
      if (source) {
        var sourceEl;
        if (source.indexOf("#") === 0 || source.indexOf(".") === 0) {
          if (source) {
            sourceEl = document.querySelector(source);
            if (sourceEl) {
              viewEl.innerHTML = sourceEl.innerHTML;
            }
          }
          if (options.controller && !options.viewUrl) {
            options.controller.call(undefined, viewEl);
          }
          viewReady(options);
        } else if (source.indexOf("<") === 0) {
          viewEl.innerHTML = source;
          if (options.controller && !options.viewUrl) {
            options.controller.call(undefined, viewEl);
          }
          viewReady(options);
        }
      } else if (options.viewUrl) {
        loadViewUrl(options.viewUrl, function (html) {
          viewEl.innerHTML = html;
          if (options.controller) {
            options.controller.call(undefined, el);
          }
          viewReady(options);
        });
      } else {
        viewReady(options);
      }
    }
  }
};
