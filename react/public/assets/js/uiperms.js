
var _getRole = function(project){
    project = project || getProject();
    var user = w7.storage('userData');
    if (!user || !user.roles || !user.roles.length) {
        return false;
    }
    for (var i = 0; i < user.roles.length; i++ ){
        if( user.roles[i].project === project ) {
            return user.roles[i];
        }
    }
    return false;
}



var isOwner = function(project) {
    project = project || getProject();
    var user = w7.storage('userData');
    if (!user || !user.ownsProjects) {
        return false;
    }

    return !!user.ownsProjects.find(function (prj) {
        return prj === project;
    });
};

il.objectIs = {
    parentIsRrestricted: function(obj) {
        
    },
    restricted: function(obj) {
        if(!obj) {
            return false;
        }
        return (obj.accessGroups && obj.accessGroups.length) || (obj.users && obj.users.length);
    }
}


w7.perms = {
    _projects: null,
    monitorActivity: function (project) {
        return isOwner(project)
    },
    $manageProject: function (project) {
        project = project || getProject();
        return isOwner(project);
    },
    $accessProject: function (project) {
        project = project || getProject();
        return isOwner(project) || !!_getRole(project);
    },
    $createProject: function () {
        var user = w7.storage('userData');
        return !!user.payment && !!user.payment.validUntil && new Date(user.payment.validUntil).getTime() > new Date().getTime();
    },
    $isLogged: function () {
        return !!w7.storage('userData');
    },
    createObject: function (project) {
        project = project || getProject();
        if(isOwner(project)) return true;
        var role = _getRole(project);
        if(!role) return false;
        return role.can.createObject;
    },
    canComment: function (project) {
        project = project || getProject();
        if(isOwner(project)) return true;
        var role = _getRole(project);
        if(!role) return false;
        return role.can.canComment;
    },
    deleteObject: function (project, object) {
        project = project || getProject();
        if(isOwner(project)) return true;
        var role = _getRole(project);
        if(!role) return false;
        var user = w7.storage('userData')
        return role.can.deleteObject
            && (!object || !object.users.length || object.users.indexOf(user._id) !== -1 || !!object.accessGroups.find(function (g) { return g.users.indexOf(user._id) !== -1 }));
    },
    modifyObject: function (project, object) {
        project = project || getProject();
        if(isOwner(project)) return true;
        var role = _getRole(project);
        if(!role) return false;
        var user = w7.storage('userData')
        return role.can.modifyObject
            && (!object || !object.users.length || object.users.indexOf(user._id) !== -1 || !!object.accessGroups.find(function (g) { return g.users.indexOf(user._id) !== -1 }));
    },
    previewObject: function (project, object) {
        project = project || getProject();
        if(isOwner(project)) return true;
        var role = _getRole(project);
        if(!role) return false;
        var user = w7.storage('userData')
        return role.can.previewObject
            && (!object || !object.users.length || object.users.indexOf(user._id) !== -1 || !!object.accessGroups.find(function (g) { return g.users.indexOf(user._id) !== -1 }));
    },
    createRole: function (project) {
        project = project || getProject();
        if(isOwner(project)) return true;
        var role = _getRole(project);
        if(!role) return false;
        var user = w7.storage('userData')
        return role.can.createRole;
    },
    deleteRole: function (project) {
        project = project || getProject();
        if(isOwner(project)) return true;
        var role = _getRole(project);
        if(!role) return false;
        var user = w7.storage('userData')
        return role.can.deleteRole;
    },
    modifyRole: function (project) { // modify access groups
        project = project || getProject();
        if(isOwner(project)) return true;
        var role = _getRole(project);
        if(!role) return false;
         return role.can.modifyRole;
    }
};


w7.perm = function(opt){
    var name = opt.name,
        obj = opt.object,
        project = opt.project || getProject(),
        callback = opt.callback;
    const result = w7.perms[name] && w7.perms[name](project, obj);
    if (typeof callback === 'function') {
        callback.call(undefined, result);
    }
};

w7.ifCan = function(name, obj, project, callback){
    if(typeof obj === 'function') {
        callback = obj;
        obj = undefined;
    }
    if(typeof project === 'function') {
        callback = project;
        project = undefined;
    }
    obj = null;
    w7.perm({
        name: name,
        object: obj,
        project: project,
        callback: function (can) {
            if(callback) {
                callback.call(can, can);
            }
        }
    })
};

w7.__permsTrackOnce = false;
w7.__permsTrack = function (root) {
    if(!root) root = document.body;
    var dt = root.querySelectorAll('[data-perm]');
    if(dt.length) {
        $(dt).each(function () {
            var obj = this._$dataReflect;
            var name = $(this).attr('data-perm');
            (function (el) {

                w7.ifCan(name, obj, function (can) {
                    $(el)[can ? 'show' : 'remove']().removeAttr('data-perm');
                    el.removeAttribute('data-perm')
                });
            })(this);
        });
    }
    var dt2 = root.querySelectorAll('[data-permsection]');
    if(dt2.length) {
        $(dt2).each(function () {
            var obj = this._$dataReflect;
            var name = $(this).attr('data-permsection');

            ;(function (el) {
                w7.ifCan(name, obj, function (can) {
                    if(!can) {
                        el.innerHTML = '<div class="no-perms-block">You don\'t have access to this section.</div>';
                    }
                    el.removeAttribute('data-permsection')
                });
            })(this);
        });
    }
    if(!w7.__permsTrackOnce) {
        w7.__permsTrackOnce = true;

    }



    var bd = document.getElementById('table-view-body');
    if(bd) {
        $('.wui-dropdown', bd).each(function () {
            var ul = this.__ul;
            var lis = $('li', ul);
            var lisHidden = lis.filter('li[style*="none"][style*="display:"]');
            if(lis.length === lisHidden.length) {
                $(this).remove();
            }
        });
    }

/*    var fas = $('.folder-add-section');
    var ul = fas.find('.wui-dropdown')[0]
    if( $('.folder-add-section li:visible', ul.__ul).length === 0) {
        fas.hide()
    } else {
        fas.show().css('opacity', 1)
    }*/

};

