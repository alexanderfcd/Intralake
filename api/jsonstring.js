/********************************************************

  Tool for manipulating JSON-like strings.

  e.g.: '  name:John, int:21, isLogged : true '

  Usage:

  var obj = jsonstring('key:lorem ipsum, item:2');
      Returns:
        {
          data:'key:lorem ipsum, item:2',
          json: { key:'lorem ipsum', item:2 }
        }

  Methods:

    obj.item('key') // Returns value for key
    obj.item('key', 'new value')  // Sets value for key




/********************************************************/

(function (root) {
  var jsonstring = function (string) {
    return new jsonstring.prototype.init(string);
  };
  jsonstring.prototype = {
    init: function (string) {
      var scope = this;
      if (!scope.initialized) {
        if (typeof string === "undefined") {
          string = "";
        }
        if (typeof string !== "string") {
          return string;
        }
        scope.data = string.trim();
        scope.json = {};
        scope.initialized = true;
        scope.data.split(",").forEach(function (item) {
          var keyval = item.split(":");
          if (keyval.length > 1) {
            var key = keyval[0].trim();
            var val = keyval[1].trim();

            if (/^\d+$/.test(val)) {
              val = parseInt(val, 10);
            } else if (val === "true") {
              val = true;
            } else if (val === "false") {
              val = false;
            }

            scope.json[key] = val;
          }
        });
      }
      return this;
    },
    set: function (a, b) {
      this.json[a] = b;
      this.transform();
      return this;
    },
    get: function (a) {
      if (!a) return this.json;
      return this.json[a];
    },
    item: function (a, b) {
      if (typeof b === "undefined") return this.get(a);
      return this.set(a, b);
    },
    transform: function () {
      var _new = [],
        i;
      for (i in this.json) {
        _new.push(i + ":" + this.json[i]);
      }
      this.data = _new.join(",");
      return this;
    },
  };
  jsonstring.prototype.init.prototype = jsonstring.prototype;
  if (typeof define === "function" && define.amd) {
    define([], function () {
      return jsonstring;
    });
    root.jsonstring = jsonstring;
  } else if (typeof module === "object" && typeof exports === "object") {
    module.exports = jsonstring;
  } else {
    root.jsonstring = jsonstring;
  }
})(this);
