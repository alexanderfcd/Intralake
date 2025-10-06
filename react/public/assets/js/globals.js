 

w7.event = {
    on: function (name, id, callback) {
        var arr = name.trim().split(' ');
        if(typeof id === 'function') {
            callback = id;
            id = '*';
        }
        if(arr.length > 1) {
            arr.forEach(function(item){
                w7.event.on(item.trim(), id, callback);
            });
            return;
        }
        if(!w7._ge[name] || !!w7._ge[name][id]){
            w7._ge[name] = w7._ge[name] || {};
            if(id === '*') {
                w7._ge[name]['*'] = w7._ge[name]['*'] || [];
                w7._ge[name]['*'].push(callback)
            } else {
                w7._ge[name][id] = callback;

            }
        }
    },
    dispatch: function (name, args) {
        if(w7._ge[name]) {
            for (var key in w7._ge[name]) {
                var val = w7._ge[name][key];
                if (key === '*') {
                    val.forEach(function (func) {
                        func.apply( func , [args] );
                    })
                } else {
                    val.apply( val , [args] );
                }
            }

        }
    }
};


window.lang = function(data){
    if(typeof data === 'string') {
        data = data.trim();
    }
    if(window._LANG && window._LANG[data]){
        return _LANG[data];
    }
    return data;
};
w7.lang = window.lang;

var __attrLang = function(){
    w7.each('[title*="lang("]', function () {
        var attr = this.getAttribute('title').trim().replace('lang(', '').replace(')', '');
        this.title = attr ? lang(attr) : '';
    });
    w7.each('[placeholder*="lang("]',function () {
        var attr = this.getAttribute('placeholder').trim().replace('lang(', '').replace(')', '');
        this.placeholder = attr ? lang(attr) : '';
    });
    w7.each('[wtip*="lang("]', function () {
        var attr = this.getAttribute('wtip').trim().replace('lang(', '').replace(')', '');
        this.setAttribute('wtip', attr ? lang(attr) : '')
    });
    w7.each('lang',function () {
        var txt = this.innerText.trim();
        var txtnode = document.createTextNode(lang(txt))
        this.parentNode.replaceChild(txtnode, this);

    });
}

w7.obSize = function(x){
    var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var l = 0, n = parseInt(x, 10) || 0;
    while(n >= 1024 && ++l)
        n = n/1024;
    return(n.toFixed(n >= 10 || l < 1 ? 0 : 1) + ' ' + units[l]);
};

w7.__dataActive = function() {
    var loc = window.location.pathname.split('/').pop();

    w7.each('[data-active]', function () {
        if (  loc ===  (this.getAttribute('data-active')) ) {
            this.classList.add('active')
        } else {
            this.classList.remove('active')
        }
    });
}




w7.queryParam = function (param, val) {
    var queryParams = new URLSearchParams(location.search);
    if(!val) {
        return queryParams.get(param);
    }
    queryParams.set(param, val);
    w7._reacthistory.push({
        search: '?' + queryParams.toString()
    })
}
w7.setQuery = function (q) {
    q = q || {};
    var search = [];
    for (var key in q) {
        search.push (key + "=" + encodeURIComponent(q[key]))
    }
    search = search.length ? '?' + search.join('&') : '';
    w7._reacthistory.push({
        search: search
    })
}

w7.copy = function (text) {
    if(navigator.clipboard &&  navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
    } else {
        var aux = document.createElement("input");

        aux.setAttribute("value", text);

        document.body.appendChild(aux);

        aux.select();

        document.execCommand("copy");

        document.body.removeChild(aux);
    }

}


window.setPath = function (path) {
    if(w7._reacthistory) {
        w7._reacthistory.push(path);
    } else if(window.il && il.goto ) {
        il.goto(path)
    } else {
        location.pathname = path;
    }
    w7.__dataActive();
};

window.refreshCurrent = function()  {
    const folder = getFolder();
    const search = location.search;
    setPath('/project/' + ( getProject()) + (folder ? '/folder/' + folder : '') + (search ? search : ''));
}

window.getPath = function() {
    if(w7._reacthistory){
        return w7._reacthistory.location.pathname;
    }
    else {
        return location.pathname;
    }
};


window.getSlashParam = function(name) {
    var main = getPath().split(name+'/')[1];
    if(main){
        return main.split('?')[0].split('/')[0];
    }
};



w7.getFolder = window.getFolder = function(){
    return getSlashParam('folder') || ((w7.viewData && w7.viewData.context ? (w7.viewData.context.folder || null) : null) ) ;
};
w7.getProject = window.getProject = function(){
    return getSlashParam('project') || getSlashParam('admin') || getSlashParam('pt');
};
w7.getObject = window.getObject = function(){
    return getSlashParam('object');
};







window.setPathParam = function(name, val){
    if(getPath().indexOf('/' + name + '/') !== -1){
        var p = getPath().split('/' + name + '/')[1].split('/')[0];
        setPath(getPath().replace('/'+name+'/' + p, '/'+name+'/' + val))
    } else{
        setPath((getPath() + '/' +name + '/' + val).replace(/\/\//g, '/'))
    }
};

window.removepathParam = function (name) {
    if(getPath().indexOf('/' + name + '/') !== -1) {
        var p = getPath().split('/' + name + '/')[1].split('/')[0];
        setPath(getPath().replace('/' + name + '/' + p, ''));
    }
};

window.getPathParams = function () {
    var arr = getPath().split('?')[0].split('/').filter(function (a) {
        return  !!a;
    });
    var params = {};
    if(arr.length < 2){
        return params;
    }
    for(var i =0; i<arr.length;i+=2){
        params[arr[i]] = arr[i+1];
    }
    return params;
};
window.getPathParam = function (name) {
    var arr = getPath().split('/' + name + '/');
    return arr[1] ? arr[1].split('/')[0] : '';
};

window.setFolder = function(val){
    setPathParam('folder', val);
};
window.setProject = function(){
    setPathParam('project', val);
};
window.setObject = function(){
    setPathParam('object', val);
};

w7.service = {
    getPath: function (where, param){
        if(where === 'home') {
            return (w7.Config.home);
        } else if(where === 'projectUsers') {
            return ('/admin/' + getProject() + '/users');
        } else if(where === 'plugins') {
            return ('/admin/' + getProject() + '/plugins');
        } else if(where === 'projects') {
            return ('/admin/' + getProject() + '/roles')
        } else if(where === 'AccessGroups') {
            return ('/admin/' + getProject() + '/access-groups')
        } else if(where === 'accessGroup') {
            return ('/admin/' + getProject() + '/accessGroup/' + (param || 0))
        } else if(where === 'projectSettings') {
            return ('/admin/' + getProject() + '/settings')
        } else if(where === 'dashboard') {
            return ('/dashboard/project/' + getProject() )
        } else if(where === 'editCurrentObject') {
            return ('/project/' + getProject() + '/object/' + getObject() + '/edit' )
        } else if(where === 'object') {
            return ('/project/' + getProject() + '/object/' + getObject())
        }
    },
    goto: function (where, param) {
        where = where.trim();
        if(where === 'home') {
            setPath(w7.Config.home);
        } else if(where === 'projectUsers') {
            setPath('/admin/' + getProject() + '/users');
        } else if(where === 'plugins') {
            setPath('/admin/' + getProject() + '/plugins');
        } else if(where === 'projects') {
            setPath('/admin/' + getProject() + '/roles')
        } else if(where === 'AccessGroups') {
            setPath('/admin/' + getProject() + '/access-groups')
        } else if(where === 'accessGroup') {
            setPath('/admin/' + getProject() + '/accessGroup/' + (param || 0))
        } else if(where === 'projectSettings') {
            setPath('/admin/' + getProject() + '/settings')
        } else if(where === 'delete-project') {
            setPath('/admin/' + getProject() + '/delete-project')
        } else if(where === 'dashboard') {
            setPath('/dashboard/project/' + getProject() )
        } else if(where === 'editCurrentObject') {
            setPath('/project/' + getProject() + '/object/' + getObject() + '/edit' )
        } else if(where === 'object') {
            setPath('/project/' + getProject() + '/object/' + getObject())
        } else if(where === 'backToProject') {
            setPath('/project/' + getProject() )
        }
        var path = w7.service.getPath(where, param);
        if(path) {
            setPath(path)
        } else {
            console.log(where + ' is not defined')
        }


    },
    projectImagePath: function (projectData) {
        if(!projectData.image) {
            return 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';
        }
        return w7.Config.api.domain + '/static/' + projectData.image;
    },
    setSearchPlaceholder: function (obj) {
        var el;
        if (obj && (el = document.querySelector('form.header-search [name="search"]'))) {
            el.placeholder = 'Search in "' + obj.name + '"';
        }
    }
}

window.doSearch2 = function(form){
    if(!form) {
        return;
    }
    var keywordField = form.querySelector('[name="search"]');
    var keyword = keywordField ? keywordField.value.trim() : '';
    removepathParam('object');
    removepathParam('object');
    setParam('find', keyword);
    var type = document.querySelector('[name="type"]').value.trim();
    var tags = (document.querySelector('[name="tags"]').value || '').split(',').map(function(tag){return tag.trim()}).join(',');

    var size2 = document.querySelector('[name="size2"]').value.trim() ;
    var size = document.querySelector('[name="size1"]').value.trim() + '-' + size2 + '-' + document.querySelector('[name="size3"]').value.trim();

    if(!size2) {
        size = '';
    }

    var modified = document.querySelector('[name="modified"]').value.trim();

    removeQueryParam('page');
    setParam('type', type);
    setParam('tags', tags);
    setParam('size', size);
    setParam('modified', modified);
};


window.doSearch = function(form, folder){
    if(!form) {
        return;
    }
    var keywordField = form.querySelector('[name="search"]');
    var keyword = keywordField ? keywordField.value.trim() : '';


    var type = form.querySelector('[name="type"]').value.trim();
    var tags = (form.querySelector('[name="tags"]').value || '').split(',').map(function(tag){return tag.trim()}).join(',');

    var size2 = form.querySelector('[name="size2"]').value.trim() ;
    var size = form.querySelector('[name="size1"]').value.trim() + '-' + size2 + '-' + document.querySelector('[name="size3"]').value.trim();

    if(!size2) {
        size = '';
    }

    var modified = form.querySelector('[name="modified"]').value.trim();



    var obj = {
        find: keyword,
        type: type,
        tags: tags,
        size: size,
        modified: modified,
    }
    // history.pushState(null, null, );

    removepathParam('object')
    removepathParam('edit')
    if(folder) {
        setPathParam('folder', folder)
    } else {
        removepathParam('folder')
    }

    // il.router.goto(location.pathname + '?' + (new URLSearchParams(obj)).toString())
    location.href = (location.pathname + '?' + (new URLSearchParams(obj)).toString())
};


window.getParams = function(){
    var p = location.href.split('?')[1];
    if(!p) return {};
    p = p.split('&');
    var final = {};
    var i = 0;
    for ( ; i<p.length; i++){
        var c = decodeURIComponent(p[i]).split('=');
        final[c[0]] = c[1]
    }
    return final;
};
window.setParam = function(param, value){
    var params = getParams();
    params[param] = value;
    var path = getPath().split('?')[0].replace('#/', '');
    if(path.indexOf('/') !== 0 ) {
        path = '/'+path;
    }
    setPath(path + '?' + $.param(params));
};

window.goToObject = function (id, version) {
    version = version ? ('/v/'+version) : '';
    setPath('/project/' + getProject() + '/object/'+id + version);
};

il.getHomePath = () => {
    var back = location.href.split('back=')[1];
    if(back){
        return back.split('&')[0];
     
    
    }
    if(w7.Config.home) {
        return (w7.Config.home);
        
    }
    var project = getProject();
    if(project) {
        return ('/project/' + project);
    } else {
        return ('/');
    }
}
window.goToHome = function (forced) { 
    if(forced) {
        location.pathname = il.getHomePath();
    } else {
        setPath(il.getHomePath());
    }
    

};
window.goToLogin = function (logout) {

    if(typeof logout === 'undefined') {
        logout = true;
    }
    if(logout) {
        w7.storage('userData', null);
    }
    if(getPath().indexOf('login') === -1) {
         location.href = (w7.loginURL());
    }
};
w7.goToLogin = goToLogin;


w7.loginURL = function () {
    var back = location.pathname;
    if(!back.replace(/\//, '')) {
        return ('/login');
    } else {
        return('/login?back=' + back);
    }
};

w7.thisDialog = function(target) {
    var parent = $(target).parents('.w7-modal-holder:first')[0];
    return parent.__dialog;
};

w7.each = function (selector, callback, root) {
    var rt;
    if(typeof callback === 'object' || typeof root === 'function') {
        rt = callback;
        callback = root;
    }
    rt = rt || document;

    var all = rt.querySelectorAll(selector);
    var i = 0, l = all.length;
    for ( ; i < l; i++ ) {
        callback.call(all[i], all[i]);
    }
}


window.goToAdmin = function (section, project) {
    section = section || 'settings';
    setPath('/admin/' + (project || getProject()) + '/' + section );
};
window.goToFolder = function (id, project) {
    setPath('/project/' + (project || getProject()) + '/folder/' + id);
};
w7.goToDashboard = function ( project) {
    setPath('/dashboard/project/' + (project || getProject()));
};
w7.editDocument = function (id, project) {
    setPath('/project/' + (project || getProject()) + '/object/' + id + '/edit');
};
window.goToProject = function (id) {
    // setPath('/project/' + id);

    // needs to reload for the module scripts
    window.location.href = '/project/' + id;
};

window.removeQueryParam = function (param) {
    var queryParams = new URLSearchParams(window.location.search);
    queryParams.delete(param);
    setPath(location.pathname + "?" + queryParams.toString());
}

window.displayName = function(obj){


    if(!obj) {
        return '';
    }
    if ( obj.author ) {
        obj = obj.author;
    } else {
     }

    var final = '';
    if(obj.image) {
        
        var img = '<span class="w-author-image" style="background-image: url('+w7.Config.api.domain + '/static/'  + obj.image + ')"></span>';
   
        final = img + final;
    } else {
        var img = '<span class="w-author-image"></span>';
   
        final = img + final;
    }
    if(obj.name){
        final += obj.name;
        return final;
    }
    if(obj.title){
        final += obj.title;
        return final;
    }
    if(obj.displayName){
        final += obj.displayName;
        return final;
    }

    if(obj.firstName){
        final += obj.firstName;
    }
    if(obj.lastName){
        final += ' ' +obj.lastName;
    }

    var user = w7.storage('userData');

 

    return '<span class="w-author-block">' + final + '</span>';
};

const _userDateTime = dateObj => dateObj ? _getDate(dateObj).toLocaleString() : '';
const _userDate  = dateObj => dateObj ? _getDate(dateObj).toLocaleDateString() : '';
const _userTime  = dateObj => dateObj ? _getDate(dateObj).toLocaleTimeString() : '';
const _userAgo  = dateObj => dateObj ? moment(_getDate(dateObj)).fromNow() : '';

const _getDate = date => {
    return moment(date).toDate();
}

window.userAgoString = function(date){
     
    return `${_userAgo(date)}\n${_userDateTime(date)}`;
}
window.userDate = function(date){
   
    var date = _userDateTime(date);
    return '<span class="user-date-element" title="'+date+'">'+ _userAgo(date) +'</span>';
};

window.userTime = function(date){
    return  _userTime(date);
};

window.userDateTime = function(date){
    return  _userDateTime(date) ;
};


window.tableView = function(){
    return w7view.files.view();
};

window.objectView = function(id, version, isPublic){
    return w7view.files.fileObject(id, version, isPublic);
};

window.optionsMenu = function (item) {
    return $(".tpl-menu").html()
};


w7.displayName = displayName;

var getCurrentProjectData = function (c) {
    var project = getProject();
    if(project) {
        return w7.project.getById(getProject(), function(data){
            if(c) {
                c.call(this, data);
            }
        })
    }
};

w7.displayRoleForProject = function (project) {
    var user = w7.storage('userData');
    if(!user) {
        return '';
    }
    if (user.ownsProjects && user.ownsProjects.indexOf(project._id) !== -1) {
        return 'Your role: <b>Owner</b>';
    }
    for (var i = 0; i < user.roles.length; i++) {
        var item  = user.roles[i];
        if (item.project === project._id || item.project === project._id) {
            return 'Your role: <b>' + item.name + '</b>';
        }
    }
    return ''
}

w7.is = {
    _editCore: function (){
        return location.pathname.indexOf('/edit') !== -1
    },
    _previewCore: function (){
        return location.pathname.indexOf('/object/') !== -1
    },
    preview: function () {
        return this._previewCore() && !this.edit();
    },
    edit: function () {
        return this._previewCore() && this._editCore();
    }
}


const _initReady = () => {
    setTimeout(function () {
        var cls = document.body.className;
        cls += (' touchscreen-' + !!window.ontouchstart);
        document.body.className = cls.trim();
        var wtipTime = null;
        $(document).on('mouseenter', '[wtip]', function(){
            clearTimeout(wtipTime);
            wtipTime = setTimeout(function (el){
                if(el && document.body.contains(el)) {
                    w7._tooltip(el.getAttribute('wtip'), el)
                }
            }, 456, this)
        }).on('mouseleave', '[wtip]', function(){
            clearTimeout(wtipTime);
        });
        w7.__permsTrack();
        setInterval(function () {
            __attrLang();
            w7.__permsTrack();
             
        }, 300)
    }, 10);
}

if ( document.readyState === "complete" ) {
    _initReady();
}

//w7.domReady(function () {
window.addEventListener('load', function () {
    _initReady()


});


