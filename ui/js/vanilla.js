(function () {
  const icons = {
    noop: ``,
    token:
      '<svg fill="none" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg"><path d="m17.5711 12.5c0 2.7614-2.2386 5-5 5m-5.00003-5c0-2.76142 2.23857-5 5.00003-5m7.9289 5c0 4.4183-3.5817 8-8 8-4.41828 0-8-3.5817-8-8 0-4.41828 3.58172-8 8-8 4.4183 0 8 3.58172 8 8z" stroke="currentColor" stroke-width="1.2"/></svg>',
    trash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"  fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`,
    favorites: `<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 -960 960 960"  fill="currentColor"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>`,
  };

  il.icon = function (name = `noop`, options = {}) {
    const defaults = {
      asElement: false,
    };
    const settings = Object.assign({}, defaults, options);

    const icn = icons[name];
    const cls = `il-icon il-icon-${name}`;

    if (settings.asElement) {
      var el = document.createElement("span");
      el.innerHTML = icn;
      el.className = cls;
      return el;
    }
    return `<span class="${cls}">${icn}</span>`;
  };

  il.icon.add = function (name, value) {
    if (typeof name === "object") {
      for (let key in name) {
        il.icon.add(key, name[key]);
      }
      return;
    }
    if (!name || icons[name]) {
      return;
    }
    icons[name] = value;
  };

  const _cssScopes = [];
  il.css = (scope, css) => {
    if (_cssScopes.indexOf(scope) === -1) {
      _cssScopes.push(scope);
      const node = document.createElement("style");
      node.textContent = css;
      document.body.appendChild(node);
    }
  };
})();

il.config.logo.href = il.config.homeURL;

il.progressbar = function () {
  var el = document.createElement("div");
  el.classList.add("il-progress-circle");
  var donemark = `<svg xmlns="http://www.w3.org/2000/svg"  class="il-progress-circle-done" viewBox="0 0 24 24" fill="#4285f4"><path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" /></svg>`;

  el.innerHTML = `<svg class="progress-circle" viewBox="0 0 44 44">
    <text x="22" y="22" font-size="7" text-anchor="middle" alignment-baseline="central"></text>
    <circle class="bg" r="16" cx="22" cy="22" stroke-width="4" fill="none"></circle>
    <circle class="progress" r="16" cx="22" cy="22" transform="rotate(-90, 22, 22)" stroke-width="4" fill="none" stroke-dasharray="100" stroke-dashoffset="21.5"></circle>
 </svg>${donemark}`;

  this.node = el;
  var v = 0;

  this.invisible = function () {
    this.node.style.visibility = "hidden";
    this.node.style.opacity = "0";
  };

  this.visible = function () {
    this.node.style.visibility = "";
    this.node.style.opacity = "";
  };

  this.hide = function () {
    this.node.style.display = "none";
  };

  this.show = function () {
    this.node.style.display = "";
  };

  this.value = function (val, label) {
    if (typeof val === "undefined") {
      return v;
    }
    val = parseFloat(val);
    val = Math.round(val);
    v = val;
    if (label) {
      el.querySelector("svg text").innerHTML = val + "%";
    }

    el.querySelector("circle.progress").style.strokeDashoffset = 100 - val;
    if (v === 100) {
      el.classList.add("ready");
    }
    this.node.dataset.value = val;
  };
  this.value(v);
};
