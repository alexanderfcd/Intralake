

w7.id = function (prefix) {
    var rand = Math.floor(Math.random() * (1 - 99999 + 1)) + 99999;
    prefix = prefix || 'intrl-id-';
    var id = new Date().getTime() + '' + rand;
    return prefix + id;
}

w7.domReady = function(fn) {
    document.addEventListener("DOMContentLoaded", fn);
    if (document.readyState === "interactive" || document.readyState === "complete" ) {
        fn();
    }
}

var el = function (tag, props) {
    if (typeof tag === 'object') {
        props = tag;
        tag = props.tag || 'div';
    }
    if (!props) {
        props = {};
    }
    delete props.tag;
    if (!tag) {
        tag = 'div';
    }
    if(tag === 'button' && !props.type) {
        props.type = 'button';
    }
    var node = document.createElement(tag);
    if (typeof props.guard === 'function') {
        if(!props.guard()) {
            node.className = 'il-node-guard-false';
            return node;
        }
    }
    if (props.hookStart) {
        il.dispatch(props.hookStart, node);
    }
    if (props.css) {
        for (var css in props.css) {
            if(props.css.hasOwnProperty(css)) {
                node.style[css] = props.css[css];
            }
        }
        delete props.css
    }
    if (props.dataset) {
        for (var dataset in props.dataset) {
            if(props.dataset.hasOwnProperty(dataset)) {
                node.dataset[dataset] = props.dataset[dataset];
            }
        }
        delete props.dataset
    }
    if (props.$ready) {
        var onReady = props.$ready;
        var readyTime = -80;
        var runReady = function () {
            readyTime += 100;
            if(readyTime > 10000) {
                console.warn('Element not present. ', node)
                return;
            }
            setTimeout(function (){
                if(document.documentElement.contains(node)) {
                    onReady(node)
                } else {
                    runReady();
                }
            }, readyTime)
        }

        runReady()

        delete props.$ready;
    }
    if (props.on) {

        for (var ev in props.on) {
            if(props.on.hasOwnProperty(ev)) {

                node.addEventListener(ev, function(event) {
                    props.on[ev].call(node, event);
                });
            }
        }

        //delete props.on
    }
    if (props.content) {
        if( Array.isArray(props.content) ) {
            var c = 0, l = props.content.length;
            for( ; c < l; c++) {
                var itm = props.content[c];
                if(itm){
                    if(itm.nodeName){

                        node.appendChild(itm);
                    } else {
                        node.append(el(itm));
                    }
                }
            }
        } else if(props.content.nodeName){
            node.append(props.content);
        } else {
            node.append(el(props.content));
        }
        delete props.content
    }
    for (var i in props) {
        if(props.hasOwnProperty(i)) {
            node[i] = props[i];
        }
    }
    if (props.hookEnd) {
        setTimeout(function (){
            il.dispatch(props.hookEnd, node);
        }, 70)
    }
    return node;
}
w7.el = el;






w7.Config.api.root = w7.Config.api.domain + w7.Config.api._root;

w7.apiroot = function(){
    return w7.Config.api.root;
};
w7.apiurl = function(a){
    return w7.apiroot()  +  (w7.Config.api[a] || a);
};

w7.objectPreviewURLFromServer = function (id, version, project, callback)  {
    project = project || getProject();
    var url = w7.apiurl('/preview-url/' + id + '/version/' + version + '?preview=true&project=' + project);
    w7.bearerScopeGet(url, {}, function(data){
        callback.call(undefined, data);
    });
}

w7.objectPreviewURL = function (id, version, token, project) {
    token = token || w7.getStorageToken();
    project = project || getProject();
    return w7.apiurl('/object/' + id + '/version/' + version + '?token=' + token + '&preview=true&project=' + project);
}
w7.objectDownloadURL = function (id, version, token, project) {
    token = token || w7.getStorageToken();
    project = project || getProject();
    return w7.apiurl('/object/' + id + '/version/' + version + '?token=' + token + '&download=true&project=' + project);
};


w7.rootSearch = function (val, root) {
    val = val.trim().toLowerCase();
    var ch = $(root).children()
    if(!val){
        ch.show();
        $('.rootsearch-no-results', root).remove()
        return;
    }
    ch.each(function () {
        this.style.display = this.textContent.toLowerCase().indexOf(val) === -1  ? 'none' : '';
    });

    if(!ch.filter(':visible').length) {
        var noRes = document.createElement('span');
        noRes.className = 'rootsearch-no-results';
        noRes.innerHTML = lang('No items match your criteria');
        $(root).append(noRes);
    } else {
        $('.rootsearch-no-results', root).remove()
    }

};

var resizeImage = function (img, cb) {
    var reader = new FileReader();
    reader.onload = function (readerEvent) {
        var image = new Image();
        image.onload = function (imageEvent) {
            var canvas = document.createElement('canvas'),
                max_size = 500,
                width = image.width,
                height = image.height;
            if (width > height) {
                if (width > max_size) {
                    height *= max_size / width;
                    width = max_size;
                }
            } else {
                if (height > max_size) {
                    width *= max_size / height;
                    height = max_size;
                }
            }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(image, 0, 0, width, height);
            canvas.toBlob(blob => {
                cb.call( undefined, new File([blob], img.name));
            }, img.type, 0.8);
        }
        image.src = this.result;
     }
    reader.readAsDataURL(img);
}



w7.internalUploaderValue = function(selector, c) {
    selector = selector || '.internal-uploader';
    var input;
    if (selector.type === 'file') {
        input = selector;
    } else {
        var root = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!root) {
            c.call(undefined, false )
            return;
        }
        input = root.querySelector('input[type="file"]');
    }
    if (input._deleted) {
        c.call(undefined, 'delete')
        return;
    }
    if(input.files && input.files[0]) {
        resizeImage(input.files[0], function (file) {
            c.call(undefined, file)
        });
    } else {
        c.call(undefined, undefined)

    }

}

w7.internalUploader = function(conf) {
    conf = conf || {};
    conf.type = conf.type || 'image';
    conf.label = conf.label || 'Upload image';

    var wrap = $('<div class="internal-uploader"></div>');
    var preview = $('<div class="project-image-preview"></div>');
    var previewDel = $('<span class="wui-btn wui-btn-lite wui-btn-icon"><span class="material-icons">delete</span></span>');
    var up = $('<span class="wui-btn wui-btn-outline"> <lang>' + conf.label + '</lang></span>');

    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/x-png,image/gif,image/jpeg,image/webp';
    up.append(input);

    previewDel.on('click', function () {
        preview.removeAttr('style') ;
        input.value = '';
        input._deleted = true;
    });

    if (conf.value) {
        preview.css('background-image', 'url('+ w7.Config.api.domain + '/static/' + conf.value + ')');
    }

    $('input', up).on('input', function () {
        if (conf.type === 'image') {
            input._deleted = false;
            previewImageFromInput(this, preview);
        }
    });

    function previewImageFromInput(input, target){
        var $target = $(target);
        if (!input.files[0]) {
            $target.hide();
            return;
        }
        var url = URL.createObjectURL(input.files[0]);
        $target.css('background-image', 'url(' + url + ')');
        var img = new Image();
        img.src = url;
        img.onload = function(){
            $target.show()
            URL.revokeObjectURL(url);
        }
    }

    wrap.append(preview);
    preview.append(previewDel);
    wrap.append(up);

    if(conf.element) {
        $(conf.element).empty().append(wrap);
    }


}



w7._storage = {
    globalKey: 'w7b8ud',
    set:function(key,value){
        var obj = JSON.parse(this._get());
        obj[key] = value;
        localStorage.setItem(w7._storage.globalKey, JSON.stringify(obj));
        $(w7).trigger('storageChange', [key, value, obj])
    },
    _get: function(){
        var all = localStorage.getItem(w7._storage.globalKey);
        return all || this.init();
    },
    get:function(key){
        var obj = JSON.parse(this._get());
        return obj[key];
    },
    remove:function(key){
        var obj = JSON.parse(this._get());
        delete obj[key];
        localStorage.setItem(w7._storage.globalKey, JSON.stringify(obj));
    },
    init:function(){
        var curr = localStorage.getItem(w7._storage.globalKey);
        if(curr === null){
            localStorage.setItem(w7._storage.globalKey, JSON.stringify({}));
        }
        return localStorage.getItem(w7._storage.globalKey);
    },
    clean:function(){
        localStorage.setItem(w7._storage.globalKey, JSON.stringify({}));
    }
};

w7._pageTitle = null;
w7.pageTitle = function(title) {
    if (typeof title === 'undefined' || title === null) {
        return w7._pageTitle
    } else {
        w7._pageTitle = title ? title.trim() : title;
        $(w7).trigger('pageTitleChange', [title]);
    }
}


w7._storage.init();

w7.storage = function(key,val){
    if (typeof val === 'undefined'){
        return w7._storage.get(key);
    }
    else{
        return w7._storage.set(key,val);
    }
}

