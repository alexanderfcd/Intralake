w7.getStorageToken = function(){
    var userData = w7.storage('userData') || {};
    var token;
    try {
        token =  userData.user.token;
    }
    catch (err) {

    }
    return (token || userData.token || '');
};
w7.bearer = function(token){
    var userData = w7.storage('userData') || {};
    try {
        token =  token || userData.user.token;
    }
    catch (err) {

    }
    return 'Bearer ' + (token || userData.token || '');
};

w7.bearerUploadPost = function( url, data, callback, type ) {
    // return  w7.bearerPost(url, data, callback, type);
    if ( typeof data === 'function' ) {
        type = type || callback;
        callback = data;
        data = undefined;
    }
    data.project = data.project || getProject();
    return w7.ajax( $.extend( {
        url: url,
        type: 'post',
        processData: false,
        contentType: false,
        data: data,
        success: callback,
        dataType: 'json',
        xhr: function () {
            var xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', function (event) {
                var progressBar = $('.progress-bar');

                if (event.lengthComputable) {
                    var percent = (event.loaded / event.total) * 100;
                    progressBar.width(percent + '%');

                    if (percent === 100) {
                        progressBar.removeClass('active');
                    }
                }
            });

            return xhr;
        },
        beforeSend: function(xhr, settings) {
            xhr.setRequestHeader('Authorization', w7.bearer());
            xhr.setRequestHeader('Project',  getProject());
        }
    }, $.isPlainObject( url ) && url ));
};

w7.bearerDownload = function( url, callback ) {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Authorization', w7.bearer());
    xhr.setRequestHeader('Project',  getProject());
    xhr.responseType = "blob";
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (callback) {
                callback.call(undefined, xhr.response);
            }
        }
    };
    xhr.send(null);

    return xhr;

};
w7.__ajaxCBRegister = [];

w7.ajaxCBRegister = function(url, c, xhr){
    w7.__ajaxCBRegister.push({url: url, callback: c, xhr: xhr})
};

w7.ajaxCBGet = function (url, callback) {
    return w7.__ajaxCBRegister.find(function (value) {
        return value.url.indexOf(url) !== -1 && value.callback === callback;
    })
};

w7.ajaxCBClear = function (url) {
    if(url === '*') {
        for(var i = 0; i < w7.__ajaxCBRegister.length; i++) {
            if (w7.__ajaxCBRegister[i].xhr) {
                w7.__ajaxCBRegister[i].xhr.abort();
            }
        }
        w7.__ajaxCBRegister = [];
    }
    else {
        w7.__ajaxCBRegister = w7.__ajaxCBRegister.filter(function (value) {
            var is = value.url.indexOf(url) === -1;
            if (is && value.xhr) {
                value.xhr.abort();
            }
            return is;
        })
    }
};

w7.scopeGet = function (url, data, _callback, config) {
    config = config || {};
    if (typeof data === 'function') {
        _callback = data;
    }
    var callback = function(a) {
        var cb = w7.ajaxCBGet(url, _callback);
        if(cb && cb.callback) {
            cb.callback.call(this, a);
        }
    };
    var xhr =  w7.ajax( $.extend( {
        url: url,
        type: 'get',
        data: data,
        success: callback,
        dataType: 'json',
    }, $.isPlainObject( url ) && url, config ) );
    w7.ajaxCBRegister(url, _callback, xhr);
    return xhr;
};


w7._bearerScopeCacheGet = {};
w7.bearerScopeCacheClear = function () {
    w7._bearerScopeCacheGet = {};
};
w7.bearerScopeCacheGet = function (url, data, _callback) {

    var callback = function(a) {
        var cb = w7.ajaxCBGet(url, _callback);
        if(cb && cb.callback) {
            cb.callback.call(this, a);
        }
    };

    var param = $.extend( {
        url: url,
        type: 'get',
        data: data,
        success: callback,
        dataType: 'json',
    }, $.isPlainObject( url ) && url );

    var key = JSON.stringify(param);
    var time = new Date().getTime();

    var distance = 60000;
    var cacheItem = w7._bearerScopeCacheGet[key];

    if( cacheItem
        && (time - cacheItem.time) < distance ) {
        _callback.call(cacheItem.xhr, cacheItem.data);
    } else {
        w7._bearerScopeCacheGet[key] = {};
        w7._bearerScopeCacheGet[key].xhr = w7.bearerScopeGet(url, data, _callback);
        w7._bearerScopeCacheGet[key].xhr.done(function (data) {
            w7._bearerScopeCacheGet[key].data = data;
        })
    }
    return w7._bearerScopeCacheGet[key].xhr;
};

w7.bearerScopeGet = function (url, data, _callback) {
    return w7.scopeGet(url, data, _callback, {
        beforeSend: function (xhr, settings) {
            xhr.setRequestHeader('Authorization', w7.bearer());
            xhr.setRequestHeader('Project', getProject());
        }
    })
};



w7.ajax = function(url, options){
    if ( typeof url === "object" ) {
        options = url;
        url = undefined;
    }
    options.headers = options.headers || {};
    options.headers.Project = getProject() || '';


    var xhr = $.ajax(url, options);

    let _resolve, _reject;

    xhr._promise = new Promise(function (resolve, reject) {
        _resolve = resolve;
        _reject = reject;
    });

   

    xhr.await = () => {
        return xhr._promise
            .then(data => [ data, null ])
            .catch(error => [ null, error ]);
    }

    
    xhr.fail(function (jqXHR, textStatus, errorThrown) {
        wuic.loading(false);
        _reject(xhr)
        if (
            textStatus === 'abort'
            || textStatus === 'forbidden'
            || (jqXHR.responseJSON && jqXHR.responseJSON.showMessage === false)
        ) {
            return;
        }
        if(jqXHR.responseJSON && wuic.errors[jqXHR.responseJSON.type]){
            wuic.error(wuic.errors[jqXHR.responseJSON.type]);

            return;
        }
        if(jqXHR.status !== 409){
            if(jqXHR.responseJSON && jqXHR.responseJSON.message){
                wuic.error(jqXHR.responseJSON.message);
            } else if(jqXHR.responseJSON && jqXHR.responseJSON.code){
                var msg;

                if(il.sscodes[jqXHR.responseJSON.code]) {
                    msg = il.sscodes[jqXHR.responseJSON.code]
                } else {
                    msg = jqXHR.responseJSON.code.replace(/([A-Z])/g, " $1");
                    msg = msg.charAt(0).toUpperCase() + msg.slice(1).toLowerCase();
                }
                wuic.error(msg);
            } else {
                wuic.error(errorThrown || 'Error. Try again');
            }
            if(jqXHR.responseJSON && jqXHR.responseJSON.code === 1) {
                if(location.pathname.indexOf('/register') === -1) {
                    if(!w7.is.preview()) {
                        goToLogin()

                    }
                }
            }
        }
    });
    xhr.done(function (data) {
        _resolve(xhr)
         if(data && data.token){
            var curr = w7.storage('userData');
            curr.token = data.token;
            // w7.storage('userData', curr)
        }
    });
    return xhr;
};

$.each( [ "get", "post", "put", "delete" ], function( i, method ) {
    w7[ method ] = function( url, data, callback, type ) {
        if ( typeof data === 'function' ) {
            type = type || callback;
            callback = data;
            data = undefined;
        }
        return w7.ajax( $.extend( {
            url: url,
            type: method,
            dataType: type,
            data: data,
            success: callback
        }, $.isPlainObject( url ) && url ) );
    };
} );

$.each( [ "bearerGet", "bearerPost", "bearerDelete", "bearerPut" ], function( i, method ) {
    w7[ method ] = function( url, data, callback, type ) {
        if ( typeof data === 'function' ) {
            type = type || callback;
            callback = data;
            data = undefined;
        }
        var methodFinal;
        if(method.indexOf('Get') !== -1){
            methodFinal = 'GET'
        }
        else if ( method.indexOf('Post') !== -1 ){
            methodFinal = 'post'
        }
        else if ( method.indexOf('Delete') !== -1 ){
            methodFinal = 'delete'
        }
        else if ( method.indexOf('Put') !== -1 ){
            methodFinal = 'put'
        }

        var xhr = w7.ajax( $.extend( {
            url: url,
            type: methodFinal,
            data: data,
            success: callback,
            dataType: 'json',
            beforeSend: function(xhr, settings) {
                xhr.setRequestHeader('Authorization', w7.bearer() );
            }
        }, $.isPlainObject( url ) && url ) );

        xhr.fail(function(e) {
            var p = location.pathname;
            var isAuthPage = p.indexOf('/register') === 0 || p.indexOf('/reset-password') === 0 || p.indexOf('/restore-password') === 0;
            if(e.status === 403 && !isAuthPage) {
                //todo: w7.goToLogin(true)
            }
        })


        return xhr;
    };
} );




w7.xhr = {
    _handle:function(xhr){
        xhr.fail(function(jqXHR, textStatus, errorThrown) {
            w7.xhr._handleError.call(jqXHR, jqXHR, textStatus, errorThrown)
        })
    },
    _handleError:function(jqXHR, textStatus, errorThrown){
        $(".error").hide();
        if(jqXHR.responseJSON){
            if(jqXHR.responseJSON.message){
                $(".error[data-path='"+jqXHR.responseJSON.path+"']").show().html(jqXHR.responseJSON.message);
            }
            else if(jqXHR.responseJSON.length){
                $.each(jqXHR.responseJSON, function(){
                    $(".error[data-path='"+this.path+"']").show().html(this.message);
                })
            }

        }
    },
    register: function(data, callback){
        var xhr = w7.post(w7.apiurl('register'), data, function(data){
            if(callback){
                callback.call(xhr, data);
            }
        });
        w7.xhr._handle(xhr)
        return xhr;
    },
    login: function(data, callback){
        var xhr = w7.post(w7.apiurl('login'), data, function(data){
            if(callback){
                callback.call(xhr, data);
            }
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    createCreditsOrder: function(tokens){ 
        const xhr = w7.bearerPost(w7.apiurl('/create-credits-order'), {tokens}) ;

 
        w7.xhr._handle(xhr);
        return xhr;
    },
    updatePassword: function(data, callback){
        data.type = 'password2';
        var xhr = w7.bearerPost(w7.apiurl('/update-profile'), data, function(data){
            if(callback){
                callback.call(xhr, data);
            }
        })
        w7.xhr._handle(xhr);
        return xhr;
    },
    resetPassword: function(data, callback){
        var xhr = w7.post(w7.apiurl('resetPassword'), data, function(data){
            if(callback){
                callback.call(xhr, data);
            }
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    profile:function(callback){
        var xhr = w7.bearerGet(w7.apiurl('profile'), function(data){
            if(callback){
                callback.call(xhr, data);
            }
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    star: function(id, targetNode){
        if(targetNode) {
            if(targetNode._disabled) {
                return;
            }
            targetNode._disabled = true;
        }
        var xhr = w7.bearerPost(w7.apiurl('/star/' + id + '/true'), function(data){
            targetNode._disabled = false;
            targetNode.classList.add('active')
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    unstar: function(id, targetNode){
        if(targetNode) {
            if(targetNode._disabled) {
                return;
            }
            targetNode._disabled = true;
        }
        var xhr = w7.bearerPost(w7.apiurl('/star/' + id + '/false'), function(data){
            targetNode._disabled = false;
            targetNode.classList.remove('active');
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    logged:function(callback){
        var xhr = w7.bearerGet(w7.apiurl('profile'), function(data){
            if(callback){
                callback.call(xhr, data);
            }
        });
        w7.xhr._handle(xhr);
        xhr.fail(function () {
            if(callback){
                callback.call(xhr, false);
            }
        });
        return xhr;
    },
    updateProfile: function(data, callback){
        data.append('type', 'info');
        var xhr = w7.bearerUploadPost(w7.apiurl('/update-profile'), data)
            .done(function (res) {
                if(callback) callback.call(this, res);
            })
        /*var xhr = w7.bearerPost(w7.apiurl('/update-profile'), data, function(data){
            if(callback){
                callback.call(xhr, data);`  
            }
        })*/
        w7.xhr._handle(xhr);
        return xhr;
    },
    userGuard: async () => {
        return new Promise(function (resolve, reject) {
            w7.ajax.user(function (data, callback) {
                console.log(data)
            })
        })
    },
    user: function(callback){
        var xhr = w7.bearerGet(w7.apiurl('user'), function(data){
            console.log(data)
            if(callback){
                callback.call(xhr, data);
            }
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    billing: function(callback){
        var xhr = w7.bearerGet(w7.apiurl('billing'), function(data){
            if(callback){
                callback.call(xhr, data);
            }
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    userCache: function (cb) {
        var data = w7.storage('userData');
        if(data) {
            cb.call(undefined, data);
            return;
        }
        w7.xhr.user(function(userResp){
            w7.storage('userData', userResp)
            cb.call(undefined, w7.storage('userData'))
        });
    },
    accessGroupCreateOrUpdate: function(data, callback){
        var xhr = w7.bearerPost(w7.apiurl('/comment'), data, function(data){
            if(callback){
                callback.call(xhr, data);
            }
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    accessGroup: function(data, callback, id){
        id = id || getPathParam('access-group');
        if(!id) {
            return;
        }

        var ep = id == 0 ? '/create-access-group' : '/access-group/' + id;

        var xhr = w7.bearerPost(w7.apiurl(ep), data, function(data){
            if(callback){
                callback.call(xhr, data);
            }
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    comment: function(data, callback){
        var xhr = w7.bearerPost(w7.apiurl('comment'), data, function(data){
            if(callback){
                callback.call(xhr, data);
            }
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    saveTags: function (tags, id, callback) {
        var xhr = w7.bearerPost(w7.apiurl('/tags'), {tags: tags, id: id}, function(data){
            if(callback){
                callback.call(xhr, data);
            }
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    setPublic: function (id, value) {
        w7.event.dispatch('PublicityChangeStart', [value]);
        var xhr = w7.bearerPost(w7.apiurl('/public/'+id+'/'+value), function(data){
            w7.event.dispatch('PublicityChanged', [value])
        });
        w7.xhr._handle(xhr);
        return xhr;
    },
    getProjects: function (callback) {
        return w7.bearerScopeGet(w7.apiurl('/projects'), {}, function(projects){
            if(callback) {
                callback.call(this, projects);
            }
        })
    },
    updateProject: function (formData, c) {
        w7.bearerUploadPost(w7.apiurl('/project/') + getProject(), formData)
            .done(function (res) {
                if(c) c.call(this, res)
            })
    }
};

w7.handle = {
    getTarget:function(e){
        var target;
        if(e.target){
            e.preventDefault();
            target = e.target;
        }
        else{
            target = e;
        }
        return target;
    },
    afterLogin:function(response){
        w7.storage('userData', response);
        w7.xhr.user(function(userResp){
            w7.storage('userData', userResp);
        })
    },
    login:function(e){
        var target = w7.handle.getTarget(e);
        var data = {};
        $("[name]", target).each(function(){
            data[this.name] = this.value;
        });
        w7.xhr.login(data, function(data){
            w7.handle.afterLogin(data);
            if(data.confirmed) {
                
                goToHome(true);
            } else {
                location.pathname = '/confirm'        
            }
        });
    },
    register:function(e){
        var target = w7.handle.getTarget(e);
        var data = {};
        $("[name]", target).each(function(){
            data[this.name] = this.value;
        });
        w7.xhr.register(data, function(data){
            w7.handle.afterLogin(data);
            if(data.confirmed) {
                
                goToHome(true);
            } else {
                location.pathname = '/confirm'      
            }
           
        });
    },
    updateProfile:function(e){
        var target = w7.handle.getTarget(e);
        var data = new FormData();

        $("[name]", target).each(function(){
            data.append(this.name, this.value);
        });


        w7.internalUploaderValue('#profile-image', function (img){

            data.append('image', img);

            wuic.loading(true);
            w7.xhr.updateProfile(data, function(resdata){
                var currUser = w7.storage('userData');
                $.each(data, function (key, val) {
                    currUser[key] = val
                })
                w7.storage('userData', currUser);
                wuic.loading(false);
                wuic.notify(lang('Profile updated'));
            });
        });

    },
    updatePassword:function(e){
        var target = w7.handle.getTarget(e);
        var data = {};
        var fields = $("[name]", target)
        fields.each(function(){
            data[this.name] = this.value;
        });

        wuic.loading(true);
        w7.xhr.updatePassword(data, function(data){
            wuic.loading(false);
            wuic.notify(lang('Password updated'));
            fields.val('');
        });
    },
    restorePassword:function(e){
        var target = w7.handle.getTarget(e);
        var data = {};
        $("[name]", target).each(function(){
            data[this.name] = this.value;
        });
        wuic.loading(true);
        var btn = target.querySelector('[type="submit"]');
        if(btn) btn.disabled = true;

        data.type = 'password';
        var token = location.search.split('token=')[1].split('&')[0].trim();
        var xhr = w7.bearerPost(w7.apiurl('/restore-password?token=' + token), data, function(data){
            wuic.loading(false);
            wuic.notify(lang('Password successfully changed'));
            target.reset();

        })
        xhr.always(function (){
            if(btn) btn.disabled = false;
        })
        w7.xhr._handle(xhr);

    },
    resetPassword:function(e){
        var target = w7.handle.getTarget(e);
        var data = {};
        $("[name]", target).each(function(){
            data[this.name] = this.value;
        });
        wuic.loading(true);
        w7.xhr.resetPassword(data, function(data){
            wuic.loading(false);
            wuic.notify(lang('Check your email. An email with a verification was just sent to you.'));
        });
    },

    comment:function(e){
        var target = w7.handle.getTarget(e);
        var data = {};
        $("[type='submit']", target)[0].disabled = true;
        $("[name]", target).each(function(){
            data[this.name] = this.value.trim();
        });
        w7.xhr.comment(data, function(data){
            $(w7).trigger('commentCreated', [data]);

        }).always(function () {
            $("[type='submit']", target)[0].disabled = false;
        });
    },
    updateProject: function(e){
        var target = w7.handle.getTarget(e);
        var data = new FormData();
        data.append('name', w7.$('#project-name').val());
        data.append('description', w7.$('#project-description').val());
        var fileField = w7.$('[type="file"]', target)[0]
        var file = fileField.files[0];
        if(file) {
            data.append('image', file);
        } else if(fileField._deleted) {
            data.append('image', 'delete');
        }

        wuic.loading(true);
        w7.xhr.updateProject(data, function(data){
            wuic.loading(false);
            wuic.notify(lang('Project updated'));
        });
    },
    accessGroup: function(e){
        var target = w7.handle.getTarget(e);
        var group = getPathParam('access-group');
        var data = {};
        $("[type='submit']", target)[0].disabled = true;
        $("input[type='text']", target).each(function(){
            data[this.name] = this.value.trim();
        });
        var users = [];
        $("#users-list :checked", target).each(function(){
            users.push(this.value);
        });
        data.users = users.join(',')
        w7.xhr.accessGroup(data, function(data){
            $(w7).trigger('accessGroup', [data]);
            var group = getPathParam('access-group');
            if(group === '0') {
                setPath('/admin/' + getProject() + '/access-group/' + data._id);
                wuic.notify(lang('Access group created'));
                $('.delete-ag').show()
            } else {
                wuic.notify(lang('Changes are saved'));
            }


        }).always(function () {
            $("[type='submit']", target)[0].disabled = false;
        });
    },

};

$(document).ready( function () {
    w7.xhr.user(function(userResp){
        w7.storage('userData', userResp);
    });
});
