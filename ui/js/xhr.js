il.obj2FormData = function (data, formData) {
  // for nested objects
  formData = formData || new FormData();
  for (let i in data) {
    if (
      !!data[i] &&
      typeof data[i] === "object" &&
      Object.getPrototypeOf(data[i]) === Object.prototype
    ) {
      il.obj2FormData(data[i], formData);
    } else {
      formData.append(i, data[i]);
    }
  }
  return formData;
};

var XHRHandleCoreSuccess = function (scope) {
  var resp = {
    data: scope.xhr.response,
    status: scope.xhr.status,
  };
  if (resp.data.shouldFillDynamicForm && resp.data.endpoint) {
    il.spinner(false);
    il.XHRDynamicForm(resp, scope);
  } else {
    scope.runEvent("success", resp);
  }
};

il.Ajax = function (options) {
  if (!options) {
    options = {};
  }
  var defaults = {
    method: "GET",
    url: "",
    withCredentials: false,
  };
  var scope = this;

  var _events = {};
  this.on = function (e, f) {
    _events[e] ? _events[e].push(f) : (_events[e] = [f]);
    return this;
  };
  this.runEvent = function (e, f) {
    _events[e]
      ? _events[e].forEach(function (c) {
          c.call(this, f);
        })
      : "";
  };

  this.settings = Object.assign({}, defaults, options);
  this.settings.method = this.settings.method.toUpperCase();

  this.xhr = new XMLHttpRequest();
  var toSend;
  if (!this.settings.headers) {
    this.settings.headers = {};
  }
  var apiVersion = 1;
  for (var v = 2; v < 10; v++) {
    if (this.settings.url.indexOf("/v" + v + "/") !== -1) {
      apiVersion = v;
      break;
    }
  }

  let _resolve, _reject;

  this._promise = new Promise(function (resolve, reject) {
    _resolve = resolve;
    _reject = reject;
  });

  this.promise = () => this._promise;

  this.await = () => {
    return this.promise()
      .then((data) => [data, null])
      .catch((error) => [null, error]);
  };

  if (this.settings.data) {
    if (this.settings.method === "GET") {
      var urlEncodedData = "",
        urlEncodedDataPairs = [],
        name;
      for (name in this.settings.data) {
        urlEncodedDataPairs.push(
          encodeURIComponent(name) +
            "=" +
            encodeURIComponent(this.settings.data[name])
        );
      }
      urlEncodedData = urlEncodedDataPairs.join("&").replace(/%20/g, "+");
      this.settings.url +=
        (this.settings.url.indexOf("?") !== -1 ? "&" : "?") + urlEncodedData;
    } else {
      if (this.settings.data instanceof FormData) {
        toSend = this.settings.data;
      } else {
        if (this.settings.headers["Content-Type"] === "application/json") {
          toSend = JSON.stringify(this.settings.data);
        } else {
          toSend = new FormData();
          for (name in this.settings.data) {
            toSend.append(name, this.settings.data[name]);
          }
        }
      }
    }
  }

  this.xhr.withCredentials = this.settings.withCredentials;
  if (this.settings.responseType) {
    this.xhr.responseType = this.settings.responseType;
  } else {
    this.xhr.responseType = "json";
  }

  this.xhr.onload = function () {
    if (scope.xhr.status >= 200 && scope.xhr.status < 300) {
      XHRHandleCoreSuccess(scope);
      _resolve();
      if (!!scope.xhr.response && !!scope.xhr.response.message) {
        il.notify(scope.xhr.response.message);
      }
    } else {
      var status = scope.xhr.status;
      if (!!scope.xhr.response && !!scope.xhr.response.message) {
        il.alert(scope.xhr.response.message || "Error. Please try again");
      }
      if ((status === 401 || status === 403) && scope.xhr.response.message) {
      } else if (status === 404 || status === 500) {
        il.spinner(false);
        il.alert("Error. Please try again");
      }
      scope.runEvent("error", {
        data: scope.xhr.response,
        status: scope.xhr.status,
      });
      _reject();
    }
  };

  this.xhr.open(this.settings.method, this.settings.url);
  if (this.settings.headers) {
    for (var i in this.settings.headers) {
      this.xhr.setRequestHeader(i, this.settings.headers[i]);
    }
  }
  this.xhr.send(toSend);
};

il.ajax = function (options) {
  return new il.Ajax(options);
};

var _scopeGet = [];
il.scopeGetAbort = function () {
  while (_scopeGet[0]) {
    _scopeGet[0].abort();
    _scopeGet.splice(0, 1);
  }
};
il.scopeGet = function (options) {
  var xhr = il.userAjax(options);
  _scopeGet.push(xhr.xhr);
  return xhr;
};

il.userUpload = function (options) {
  if (!options) {
    options = {};
  }
  options.method = "post";
  if (!options.headers) {
    options.headers = {};
  }

  options.headers["Content-Type"] = "$auto"; // 'multipart/form-data';
  return il.userAjax(options);
};

il.appXhr = function (options) {
  if (!options) {
    options = {};
  }
  if (!options.headers) {
    options.headers = {};
  }
  if (typeof options.headers["Content-Type"] === "undefined") {
    options.headers["Content-Type"] = "application/json";
  } else if (options.headers["Content-Type"] === "$auto") {
    delete options.headers["Content-Type"];
  }
  options.responseType = "json";
  return new il.Ajax(options);
};

il.userPost = function (options) {
  if (!options) {
    options = {};
  }

  options.method = "post";

  return il.userAjax(options);
};

il.userAjax = function (options) {
  if (!options) {
    options = {};
  }
  if (!options.headers) {
    options.headers = {};
  }
  var token = w7.getStorageToken();
  if (token) {
    options.headers.Authorization = "Bearer " + token;
  }
  var xhr = new il.appXhr(options);
  xhr.on("error", function (resp) {
    if (resp.status === 401) {
      il.goto("/candidate-register");
      il.spinner(false);
    }
  });
  return xhr;
};
