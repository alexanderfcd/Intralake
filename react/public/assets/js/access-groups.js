w7.accessGroups = {
    get: function (project, c) {
        project = project || getProject();
        if(!project) {
            return;
        }
        return w7.bearerScopeGet(w7.apiurl('/access-groups/' + project), {}, function (data) {
            c.call(data, data)
        });
    },
    render: function(groups, root) {

        if(!groups || !groups.length) {
            $(root).empty().html('<p class="empty-table-message">'+lang('This project has no access groups')+'</p>')
            return;
        }

        var rolesRender = [];
        $.each(groups, function(){
            rolesRender.push({
                name: this.name,
                'Created by': displayName(this.creator),
                Users: this.users,
                _id: this._id
            });
        });
        var rolesTable = w7.objects.table(rolesRender, {
            name: '200px',
            'Created by':'120px',
            Users:'auto'
        }, {
            index: false,
            Users: function (users) {
                var html = [];
                $.each(users, function () {
                    html.push(w7.displayName(this));
                });

                return html.join('');
            }

            /* menu: [
                 {
                     title: lang('View'),
                     action: function(curr){
                         goToObject(obj._id, curr._id)
                     }
                 }
             ]*/
        });
        $(root ).empty().append(rolesTable);

        $('tbody tr', rolesTable).on('click', function(){

            setPath('/admin/' + getProject() + '/access-group/' + this._data._id);

        });
    },
    getAndRender: function (root, project) {
        this.get(project, function (roles) {
            w7.accessGroups.render(roles, root);
            w7.pageTitle(w7.lang('Access Groups'));
        })
    },
};
