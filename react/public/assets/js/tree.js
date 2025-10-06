


(function () {
    function Tree(options) {

        options = options || {};

        var scope = this;

        this.prepare = function (callback) {
            var defaults = {
                prefix: 'ti-' + Math.random().toString(36).substr(2, 9) + '-',
                project: getProject(),
                projectSwitcher: true,
                skip: []
            };
            this.settings = $.extend({}, defaults, options);
            this.$element = $(options.element);
            this.element = this.$element[0];
            this.$events = $({});
            if(callback) {
                callback.call(scope);
            }
        };

        this.project = function (id) {
            if(!id) {
                return this._project;
            }
            this._project = id;
        };


        this._selected = null;
        this.selected = function (item) {
            if(typeof item === 'undefined') {
                return this._selected;
            }
            this._selected = item;
        };

        this.prepare();
        this.project(this.settings.project);

        this.selectLi = function(item){
            $(item).parents("ul:last").find('li').removeClass('selected selected-parent');
            $(item).addClass('selected').parents('li').addClass('selected-parent');
            this.selected(item._reflect)
        };


        this.trigger = function (event, params) {
            this.$events.trigger(event, params);
        };

        this.get = this.settings.getMethod || function(folder, callback){
            var xhr = w7.bearerGet(w7.apiurl('/tree' + (folder ? '/' + folder:'')) + '?project=' + this.project(), function(data){
                callback.call(data)
            });
            xhr.fail(function(e){
                wuic.preload(false, scope.home);
            })
            return xhr;
        };

        this._addOpener = function (li, _rendered = false) {
            if(!li) {

                return
            }
            var togg = document.createElement('span');
            togg._rendered = _rendered;
            togg.className = 'material-icons tree-toggle';
            togg.innerHTML = 'keyboard_arrow_right';
            li.appendChild(togg);
            togg.onclick = function (ev) {
                if(!li._rendered){
                    li.classList.add('loading')
                    scope.get(li.dataset.id, function () {
                        li.classList.remove('loading')
                        scope.render(li, this)
                    });
                }
                li.classList.toggle('active');
            }
        }

        this.createSingle = function (obj) {
            var prefix = this.settings.prefix;
            var exists = $('#' + prefix +obj._id);
            if(exists.length){
                return exists[0];
            }
            var scope = this;
            var li = document.createElement('li');
            li._reflect = obj;
            li.id = prefix + obj._id;
            li.dataset.id = obj._id;

            var cont = document.createElement('span');
            let icon = '<span class="material-icons tree-folder-icon tree-folder-' + obj.subtype + '">' + obj.type + '</span>';
            if(obj.icon){
                icon = '<span class="tree-folder-icon tree-folder-' + obj.subtype + '">' + il.icon(obj.icon) + '</span>';
            }
            cont.innerHTML = icon + '<span class="tree-folder-title-content">' + obj.name + '</span>';
            cont.className = 'tree-item-content';
            if((obj.accessGroups && obj.accessGroups.length) || (obj.users && obj.users.length)) {
                li.className = 'limited-access';
                cont.innerHTML += '<i class="material-icons table-title-prop" wtip="Folder has limited access">privacy_tip</i>';
             }
            (function (li, obj  ) {
                cont.onclick = function (ev) {
                    scope.selectLi(li);
                    scope.selected(obj);
                    if(scope.settings.onSelect) {
                        scope.settings.onSelect.call(scope, obj, this);
                    }
                };
            })(li, obj);
            if(obj.hasChildren){
                this._addOpener(li)
            }
            li.appendChild(cont);
            return li;
        };

        this.render = function(root, data){
            if(!root) {
                return
            }
            root._rendered = true;
            var final = $();

           



            data.forEach(function(titem){
                if(scope.settings.skip.indexOf(titem._id) === -1) {
                    final.push(scope.createSingle(titem))
                }
            });
            

            if(root.nodeName === 'LI'){
                var ul = $('<ul class="tree-list-scope">');
                ul.append(final);
                $(root).find('ul').not('.tree-project-switcher-container').remove();
                $(root).append(ul);
                return ul;
            } else{
                $(root).append(final)
                return root;
            }
        };

        this.createProjectSwitcher = function(data){
            var switcher = document.createElement('span');
            switcher.className = 'tree-project-switcher';
            this._projectSwitcher = switcher;

            var dd = document.createElement('span');
            dd.className = 'wui-dropdown';

            var btn = document.createElement('b');
            btn.className = 'wui-dropdown-btn';
            btn.innerHTML = '<span class="material-icons tree-project-switcher-icon">settings</span><span class="material-icons tree-project-switcher-icon">arrow_drop_down</span>';


            var switcherContainer = document.createElement('ul');
            switcherContainer.className = 'tree-project-switcher-container';
            switcherContainer.innerHTML =
                '<li data-perm="monitorActivity" onclick="w7.service.goto(\'dashboard\'); event.stopPropagation();"> Dashboard </li>' +
                '<li data-perm="$manageProject" onclick="w7.service.goto(\'projectSettings\'); event.stopPropagation();"> Project settings </li>' +

                '<li data-perm="modifyRole" onclick=" w7.service.goto(\'projects\'); event.stopPropagation();">Roles</li>' +
                '<li data-perm="modifyRole" onclick="w7.service.goto(\'projectUsers\'); event.stopPropagation();">Users</li>' +
                '<li data-perm="modifyRole" onclick="w7.service.goto(\'AccessGroups\'); event.stopPropagation();">Access Groups</li>';


            this._switcherContainer = switcherContainer;
            dd.appendChild(btn);




            dd.appendChild(switcherContainer);
            setTimeout(() => {
                wuic.dropdown();
            }, 10 )



            data.forEach(function (ditem) {
                if(scope.project() !== ditem._id) {
                    var item = document.createElement('li');
                    item.className = 'tree-project-switcher-item';
                    item.innerHTML = '<span class="tree-project-switcher-item-image" style="background-image: url('+w7.service.projectImagePath(ditem)+');"></span>' + ditem.name;
                    item._value = ditem;

                    switcherContainer.appendChild(item);
                    item.onclick = function (e) {
                        e.stopPropagation();
                        scope.project(item._value._id);
                        scope.init()
                        if(scope.settings.onProjectSwitch) {
                            scope.settings.onProjectSwitch.call(scope, item._value, this);
                        }
                    }
                }
            });

            switcher.appendChild(dd);


            return switcher;
        };

        this.getProjectData = function (c) {
            return w7.bearerGet(w7.apiurl('/projects'), {}, function(projects){
                c.call(this, projects);
            })
        };


        this.createHome = function(){
            var scope = this;
            var li = document.createElement('li');
            li.id = this.settings.prefix + '-home';
            var cont = document.createElement('span');
            cont.innerHTML = '<span class="tree-root-icon"></span><span class="tree-home-label">...</span>';
            cont.className = 'tree-item-content tree-home';
            var togg = document.createElement('span');
            togg._rendered = false;
            togg.className = 'material-icons tree-toggle';
            togg.innerHTML = 'keyboard_arrow_right';
            li.appendChild(togg);


            togg.addEventListener('click', function (ev) {

                ev.stopPropagation()
                if(!li._rendered){
                    li.classList.add('loading')
                    scope.get(undefined, function () {
                        li.classList.remove('loading')
                        scope.render(li, this);
                    })
                }
                $(li).toggleClass('active')
            });
            li.appendChild(cont);

            ;(function (li, cont) {

                scope.getProjectData(function (data) {
                    scope.projectsData = data;


                    var projectSwitcher;
                    if(scope.settings.projectSwitcher) {
                        projectSwitcher = scope.createProjectSwitcher(data);
                         
                        li.className += ' home-item-has-project-switcher';

                        cont.appendChild(projectSwitcher);

                    } else {

                    }


                    var curr = data.find(function (item) {
                        return item._id === scope.project();
                    });
                    scope.selected(curr)
                    scope.projectData = curr;

                    if(curr) {
                        $('.tree-home-label', cont).html(curr.name);
                        $('.tree-root-icon', cont).css('background-image', 'url(' + w7.service.projectImagePath(curr) + ')');
                    }

                    cont.onclick = function (ev) {
                        if(scope.settings.onProjectSelect) {
                            scope.settings.onProjectSelect.call(scope, curr, this)
                        }
                        scope.selectLi(li);
                        scope.selected(curr);
                    };


                    setTimeout(() => {

                        wuic.dropdown();



                    }, 100)

                });
            })(li, cont);
            return li;
        };
        var _applyPath = function (scope, path = []){


 
            wuic.preload(true, scope.home);


            var active = path.shift();


            if(!active) {
                wuic.preload(false, scope.home);
                return;
            }
            var li;
            if(active._id !== '_home_'){
                li = $('#' + scope.settings.prefix + active._id)[0];
            }
            else {
                li = $('#' + scope.settings.prefix + '-home')[0];
            }

            if(active.type === 'project' && path.length)  {
                return _applyPath(scope, path)
            }

            if(li){

                if(!li._rendered) {

                    scope.get(active._id, function () {
                        scope.render(li, this);
                        scope.selectLi(li);
                        _applyPath( scope, [...path] );

                        $(li).addClass('active');
                    });
                } else {
                    scope.selectLi(li);
                    _applyPath(scope,  [...path]);
                    $(li).addClass('active')
                }
            } else {
                wuic.preload(false, scope.home); // object deleted
            }
        }


        var appTime = null;

        this.applyPath = function (path, forced){

            clearTimeout(appTime);

            appTime = setTimeout(() => {
                var jsp = JSON.stringify(path);
                if(!forced && jsp === this._currPath) return;
                this._currPath = jsp;
                var scope = this;

                _applyPath(scope, [...path])
            }, 100)


        }

;



        this.getPath = this.settings.getPath || function (folder, callback) {
            return w7.bearerGet(w7.apiurl('/path' + (folder ? '/' + folder:'')) + '?project=' + getProject(), function(data){
                callback.call(data, data)
            });
        };

        this.toggle = function () {
            this.$element.children().toggle()
        }

        this.augment = function (data) {
            // return data;
            const fav = {
                "_id": 'starred',
                "versions": null,
                "versionsLength": 1,
                "size": 0,
                "project": getProject(),
                "folder": null,
                "users": [],
                "accessGroups": [],
                "public": false,
                "deleted": false,
                "trashed": false,
                "tags": [],
                "mimeType": "",
                "type": "star",
                "subtype": 'star',
                "name": "Starred",
                "author":  null,
                "date": new Date().toISOString(),
                "dateCreated": new Date().toISOString(),
                "__v": 0,
                "hasChildren": false
            }

            const bin = {
                "_id": 'trash',
                "versions": null,
                "versionsLength": 1,
                "size": 0,
                "project": getProject(),
                "folder": null,
                "users": [],
                "accessGroups": [],
                "public": false,
                "deleted": false,
                "trashed": false,
                "tags": [],
                "mimeType": "",
                "type": "delete",
                "subtype": 'delete',
                "name": "Trash",
                "author":  null,
                "date": new Date().toISOString(),
                "dateCreated": new Date().toISOString(),
                "__v": 0,
                "hasChildren": false
            }

            var ag = data.slice();
            ag.unshift(fav);
            ag.push(bin);


            return data;
        }

        this.create = function (c) {
            var scope = this;
            scope.home = this.createHome();


            $(scope.home).addClass('active');
            var main = $('<ul class="tree"></ul>');

            this.$element.empty().append(main);
            main.append(scope.home);
            wuic.preload(true, scope.home);



            this.get(undefined, function () {
                $('.tree-toggle', scope.home)[0]._rendered = true;
                wuic.preload(false, scope.home);

                const ul = scope.render(scope.home, scope.augment(this), scope.settings.prefix);

                ul.prepend(scope.createSingle({
                    _id: 'favorites',
                    type: 'folder',
                    subtype: 'folder',
                    icon:  'favorites',
                    name: lang('Favorites')
                }));
    
                ul.append(scope.createSingle({
                    _id: 'trash',
                    type: 'folder',
                    subtype: 'trash',
                    icon: 'trash',
               
                    name: lang('Deleted files')
                }));

                scope.$events.trigger('ready', this);
                if(c) {
                    c.call()
                }
            })
        };

        this.refreshFolder = function (folder ) {
            if(folder && folder._id){
                folder = folder._id;
            }

            if(!folder) {
                return scope.reload();
            }

            var li = $('li#' + scope.settings.prefix + folder).addClass('active');

            li[0]._rendered = false;
            li.find('ul').remove()

            // scope.selectLi(li)

            scope.get(folder, function () {
                li[0].classList.remove('loading')
                const ul = scope.render(li[0], this);
                

      

                if(this.length){
                    scope._addOpener(li[0])
                } else {
                    li.children('.tree-toggle').remove()
                }
            })


        }
        this.reload = function () {

            var path = this._currPath;

            if(typeof path === 'string') {
                path = JSON.parse(path);
            }


            let folder;


            if(path && path.length > 0) {
                folder = path[path.length - 1]._id;
            }



            this.getPath(folder,   (res) => {
                this.create(function (){
                    scope.applyPath( res, true);
                });
            });



        };

        this.init = function () {
            this.create();
        };
        this.init()
    }
    wuic.Tree = Tree;
})();
