

w7.roles = {
    addUserDialog: function (selectedRoleId) {
        var footer = w7.modalFooter({text: w7.lang('Add')}, {text: w7.lang('Close')});

        if(selectedRoleId === true) {
            selectedRoleId = getPathParam('roles') || getPathParam('role');
        }

        var modal = new w7.modal({
            content: '',
            title: lang('Add user to role'),
            width: 600,
            height:'auto',
            footer: footer.footer,
            vAlign: 'top'
        });

        var select, input;

        wuic.preload(true, modal.modalContainer, true);

        w7.roles.get(getProject(), function (res) {
            var data = res.splice(0);

            if(!data || !data.length) {
                var roleUrl = '/admin/' + getProject() + '/roles';
                var clk = 'onclick="setPath("' + roleUrl + '");return false;'
                modal.modalContainer.innerHTML = w7.lang('Project has no roles yet') + '. <a '+clk+' href="'+ roleUrl +'">' + w7.lang('Create a role to continue') +'</a>';
            } else {
                data.unshift({
                    _id: false,
                    name: w7.lang('Choose'),
                    disabled: true
                })
                select = wuic.createSelect({
                    data: data,
                    label: w7.lang('Select user role'),
                    selected: selectedRoleId
                });
                input = wuic.createInput({
                    type: 'email',
                    label:  w7.lang('Enter user email')
                });

                modal.modalContainer.appendChild(select.holder);


                input.input.oninput = function () {
                    footer.ok.disabled = !input.input.validity.valid || !input.input.value || !select.input.value;
                }
                select.input.oninput = function () {
                    footer.ok.disabled = !input.input.validity.valid || !input.input.value || !select.input.value;
                }

                modal.modalContainer.appendChild(input.holder);
            }




            wuic.preload(false, modal.modalContainer, true);
        });
        footer.cancel.onclick = function () {
            modal.remove()
        }
        footer.ok.disabled = true;
        footer.ok.onclick = function () {
            wuic.preload(true, modal.modalContainer, true);
            footer.ok.disabled = true;
            w7.role.addUser(input.input.value, select.input.value)
                .done(function () {
                    wuic.preload(false, modal.modalContainer, true);
                    input.input.value = '';
                    w7.users.getAndRender('#users-table');
                })
                .fail(function (){
                    wuic.preload(false, modal.modalContainer, true);

                })

        }
    },
    get: function (project, c) {
        project = project || getProject();
        if(!project) {
            return;
        }
        return w7.bearerScopeGet(w7.apiurl('/roles/' + project), {}, function (data) {
            c.call(data, data)
        });
    },
    render: function(roles, root) {
        if(!roles || !roles.length) {
            $(root || "#roles-table").empty().html('<p class="empty-table-message">'+lang('This project has no roles')+'</p>')
            return;
        }
        var rolesRender = [];
        $.each(roles, function(){

            var perms = [];
            for (var n in  this.can) {
                if (this.can[n]) {
                    perms.push(n.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase());
                }
            }
            perms = perms.join(', ')
            rolesRender.push({
                name: this.name,
                permissions: perms,
                'Created by': displayName(this.owner),
                _id: this._id
            });
        });
        var rolesTable = w7.objects.table(rolesRender, {
            name: '200px',
            permissions:'auto',
            'Created by':'120px'
        }, {
            index: false,

           /* menu: [
                {
                    title: lang('View'),
                    action: function(curr){
                        goToObject(obj._id, curr._id)
                    }
                }
            ]*/
        });
        $(root || "#roles-table").empty().append(rolesTable);

        $('tbody tr', rolesTable).on('click', function(){

            setPath('/admin/' + getProject() + '/roles/' + this._data._id)
        });
    },
    getAndRender: function (root, project) {
        this.get(project, function (roles) {
            w7.roles.render(roles, root)
        })
    }
};
w7.role = {
    get: function (role, c) {
        role = role || location.pathname.split('/role/')[1];
        if(!role) {
            return;
        }
        return w7.bearerScopeGet(w7.apiurl('/role/' + role), {},  function (data) {
            c.call(data, data)
        });
    },
    create: function (data, project, c) {
        if(typeof project === 'function') {
            c = project;
            project = null;
        }
        project = project || data.project || getProject();
        if(!project) {
            return;
        }
        data.project = project;
        return w7.bearerPost(w7.apiurl('/role'), data, function (data) {
            c.call(data)
        });
    },
    modify: function (data, project, c) {
        if(!data.id) {
            return;
        }
        if(typeof project === 'function') {
            c = project;
            project = null;
        }
        project = project || data.project || getProject();
        if(!project) {
            return;
        }
        data.project = project;
        return w7.bearerPost(w7.apiurl('/role/' + data.id), data, function (data) {
            c.call(data)
        });
    },
    doCreate: function(data){
        wuic.preload(true, "#main-object-view");
        var rid = getPathParam('roles');
        var isCreate = rid === 'add';
        if(isCreate) {
            this.create(data, function () {
                wuic.preload(false, "#main-object-view");
                wuic.notify(lang('Role created'));
                setPath('/admin/' + getProject() + '/roles')
            });
        } else {
            data.id = rid;
            this.modify(data, getProject(), function () {
                wuic.preload(false, "#main-object-view");
                wuic.notify(lang('Role updated'));
                setPath('/admin/' + getProject() + '/roles')
            });
        }
    },
    handleSubmit: function (event) {
        event.preventDefault();
        var data = {};
        $('[name]', event.target).each(function(){
            data[this.name] = this.type === 'checkbox' ? this.checked : this.value;
        });
        data.users = [];
        this.doCreate(data);
    },
    addUser: function (val, roleId) {
        val = (val || $('[name="roleEmail"]').val() || '').trim();
        if(!val) return;
        var data = {
            email: val
        };
        return w7.bearerPost(w7.apiurl('/role-add-user/' + ( roleId || getPathParam('roles'))), data, function (rdata) {
            wuic.notify(lang('User added'));
            w7.role.rendRoles();
        });
    },


    removeUser: function (id, type) {
        if(!id || !type) return;
        wuic.loading(true);
        var data = {
            id: id, type: type
        };
        w7.bearerPost(w7.apiurl('/role-remove-user/' + getPathParam('roles')), data, function (rdata) {
            wuic.notify(lang('User removed'));
            w7.role.rendRoles();
            wuic.loading(false);
        });
    },

    deleteRole: function (id, c) {
        wuic.preload(true, ".view-role-edit");
        return w7.bearerPost(w7.apiurl('/delete-role/' + id), {},  function (data) {
            if(c) c.call(data, data);
            wuic.preload(false, ".view-role-edit");
            wuic.notify(lang('Role deleted'));
        });
    },
    rendRoles: function () {

        const id = getPathParam('roles');
        if(id === 'add'){

        } else {
            w7.role.get(id, function (data) {
                il.LakeStore.set('currentRole', data);
                w7.each('.j-delete-role-button', function (){
                    this.disabled = !!data.invitations.length || !!data.users.length;
                });
                document.querySelector('[name="name"]').value = data.name;
                w7.pageTitle(w7.lang('Role') + ': ' + data.name);
                w7.$.each(data.can, function(key,val){
                    const el = document.querySelector('[name="'+key+'"]');
                    if(el) {
                        el.checked = val === 'true' || val === true;
                    }
                });
                var holder = w7.$('#role-users-holder')
                if((data.users && data.users.length) || (data.invitations && data.invitations.length)) {
                    holder.empty()
                    w7.$.each(data.users, function (i) {
                        var wrap = w7.$('<div class="role-users-item-name"><span>'+w7.displayName(this)+'</span></div>');
                        var del = w7.$('<span class="material-icons role-users-item-delete" wtip="lang(Remove user)">delete</span>');
                        var item = this;
                        del.on('click', function() {
                            w7.role.removeUser(item._id, item.type)
                        });
                        wrap.append(del)
                        holder.append(wrap);
                    });
                    w7.$.each(data.invitations, function (i) {
                        var wrap = w7.$('<div class="role-users-item-name"><span>'+this.email+' <i>(pending)</i></span></div>');
                        var del = w7.$('<span class="material-icons role-users-item-delete" wtip="lang(Remove user)">delete</span>');
                        var item = this;
                        del.on('click', function(){
                            w7.role.removeUser(item._id, item.type)
                        });
                        wrap.append(del)
                        holder.append(wrap);
                    });
                } else {
                    holder.html('<div class="role-no-users">' + lang('Role has no assigned users') + '</div>');

                }
            });

        }
    }
};
