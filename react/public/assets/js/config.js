window.w7 = {};
w7.$ = window.jQuery || window.$;
w7.win = window;
window.w7view = {};

w7._ge = {};
w7.zone = {};
 
w7.Config = {
    home: '/', // default home page
     // home: '/pt/64552dbd4fa4e8123482d510/stream-posts', // default home page
    api: {
        domain: location.protocol + '//' + location.hostname + ':777',
        //domain:  'https://' + location.hostname + ':443',
        _root: '/app',
        register: '/register',
        login: '/login',
        profile: '/profile',
        resetPassword: '/reset-password',
        user: '/user',
        comment: '/comment',
        billing: '/billing',
        multipartUpload: '/multipart-upload',
    }
};

w7.Config.api.root = w7.Config.api.domain + w7.Config.api._root;

w7.apiroot = function(){
    return w7.Config.api.root;
};
w7.apiurl = function(a){
    return w7.apiroot()  +  (w7.Config.api[a] || a);
};

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