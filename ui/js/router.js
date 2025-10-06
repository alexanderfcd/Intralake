il.__routers = []; // global register in case of multiple routers

il.goto = function (url, router) {
  router = router || il.__routers[0];
  router.goto(url);
};

il.Router = function (options) {
  options = options || {};
  options.base = options.base || location.origin;
  this.base = options.base;
  var prevPath;
  var prevSearch;
  var scope = this;
  var _events = {};
  this.on = function (e, f) {
    _events[e] ? _events[e].push(f) : (_events[e] = [f]);
    return this;
  };
  this.runEvent = function (e, f) {
    var eharr = e.split("/").filter(function (itm) {
      return !!itm;
    });

    var found = false;
    for (var i in _events) {
      var itm = _events[i];
      if (i === e) {
        itm.forEach(function (c) {
          c.call(this, f);
        });
        found = true;
        break;
      } else if (i.includes(":")) {
        var patharr = i.split("/").filter(function (itm) {
          return !!itm;
        });
        if (eharr.length === patharr.length) {
          var is = true,
            p = 0,
            l = patharr.length;
          for (; p < l; p++) {
            if (patharr[p] !== eharr[p] && !patharr[p].includes(":")) {
              is = false;
              break;
            }
          }
          if (is) {
            itm.forEach(function (c) {
              c.call(this, f);
            });
            found = true;
          }
        }
      }
    }
    if (!found) {
      notFound();
    }
    return found;
  };

  var notFound = function () {
    if (_events["/404"]) {
      scope.goto("/404");
    }
  };
  this.goto = function (path, force) {
    path = path.trim();
    if (this.getPath() === path && !force) {
      return;
    }
    history.pushState(
      null,
      null,
      (options.base + path).replace(/([^:]\/)\/+/g, "$1")
    );
    this.eventManager();
  };

  this.getPathParams = function () {
    var path = this.getPath();
    var arr = path.split("/").filter(function (n) {
      return !!n.trim();
    });
    var obj = {};
    arr.forEach(function (item, index) {
      if (index % 2 === 0) {
        obj[item.trim()] = arr[index + 1].trim();
      }
    });
    return obj;
  };
  this.getPath = function () {
    return decodeURIComponent(
      (location.href.split(options.base)[1] || "").split("?")[0]
    ).trim();
  };
  var emTime = null;
  this.eventManager = function () {
    clearTimeout(emTime);
    emTime = setTimeout(function () {
      var path = scope.getPath();
      if (prevPath !== path) {
        prevPath = path;
        il.scopeGetAbort();
        scope.runEvent(("/" + path).replace(/\/\//g, "/"));
        scope.runEvent("$change");
      } else if (prevSearch !== location.search) {
        if (scope.runEvent(("$search/" + path).replace(/\/\//g, "/"))) {
          il.scopeGetAbort();
        }
      }
    }, 1);
  };

  this.init = function () {
    addEventListener("popstate", (event) => {
      scope.eventManager();
    });
    setTimeout(function () {
      // wait for the events definition after instance is created
      scope.eventManager();
    }, 10);

    setInterval(function () {
      var all = document.querySelectorAll("[data-link]"),
        i = 0,
        l = all.length;
      for (; i < l; i++) {
        all[i].dataset.xlink = all[i].dataset.link;
        delete all[i].dataset.link;
        all[i].addEventListener("keypress", function (e) {
          if (e.keyCode === 13) {
            e.preventDefault();
            scope.goto(this.dataset.xlink);
          }
        });
        all[i].addEventListener("click", function (e) {
          e.preventDefault();
          scope.goto(this.dataset.xlink);
        });
      }
    }, 200);
    il.__routers.push(this);
  };
  this.init();
};
