w7.users = {
    get: function (project, c) {
        if(typeof project === 'function'){
            c = project;
            project = getProject();
        }
        project = project || getProject();
        if(!project) {
            return;
        }
        return w7.bearerScopeGet(w7.apiurl('/project-data/' + project), {}, function (data) {
            c.call(data, data.users, data.roles)
        });
    },
    render: function(users, roles, root, options = {}) {
        if(!users || !users.length) {
            $(root || "#users-table").empty().html('<p class="empty-table-message">'+lang('This project has no associated users.')+'</p>')
            return;
        }

        if(typeof options.showRoles === 'undefined') {
            options.showRoles = true;
        }

        if(typeof options.selectable === 'undefined') {
            options.selectable = false;
        }

        if(typeof options.multiSelect === 'undefined') {
            options.multiSelect = true;
        }
      

        var table = $('<table class="wui-component wui-table">');
        var thead = $('<thead>');
        var tbody = $('<tbody>');
        var theadtr = $('<tr>');
        thead.append(theadtr);
        table.append(thead);
        table.append(tbody);

        $(root || "#users-table").empty().append(table);

        theadtr.append('<th>User</th>');
        if(options.showRoles) {
            theadtr.append('<th>Role</th>');
        }

        var rootCheckbox;
        var chckBoxes = []


        if(options.selectable) {
            var th = document.createElement('th');

            th.style.width = '40px';

            if(options.multiSelect) {
                var thinp = document.createElement('label');
                thinp.className = 'wui-check';
                thinp.innerHTML = '<input type="checkbox">';
                th.prepend(thinp);
                const chk = thinp.querySelector('input');
                rootCheckbox = thinp.querySelector('input');
                rootCheckbox.addEventListener('input', function() {
               
                    chckBoxes.forEach(c => c.checked = this.checked);
                     

                    if(options.onChange){
                       
            
                        options.onChange(!this.checked ? [] : chckBoxes.map(a => a.__data), {
                            checked: chk.checked, 
                            data: chk.__data, 
                            indeterminate : chk.indeterminate 
                        });
                    }
                });
                 
            }

            
            theadtr.prepend(th);
        }
        

        function displayRoles(object){
            var all = $([]);
            var prj = getProject();
            $.each(object.roles, function (ri, roleId) {
                var role = roles.find(function (item, i) {
                    return item._id === roleId
                });
                if(role && role.project === prj) {
                    var link = document.createElement('a');
                    link.innerHTML = displayName(role)
                    link.className = 'wui-btn wui-btn-outline'
                    link.onclick = function(e){
                        setPath('/admin/' + prj + '/roles/' + role._id);
                        e.stopPropagation()
                    }
                    all.push(link)
                }
            });
            return all
        }


        var _selName = 'itm' + Date.now();

        
        $.each(users, function () {
            var id = 'td-' + w7.id();

            var tr = document.createElement('tr');
            tr.innerHTML = `<td>${displayName(this)}</td>`;

            if(options.selectable) {
                var th = document.createElement('td');
                th.style.width = '40px';
                var thinp = document.createElement('label');
                thinp.className = 'wui-check';
                var check =  document.createElement('input');

                check.__data = this

                check.name = _selName
                    
                thinp.appendChild(check)
                chckBoxes.push(check)

                if(options.multiSelect) {

                    
                    check.type = 'checkbox'
                    

                    thinp.addEventListener('input', function(){
                        var inputs = tbody.find('input[type="checkbox"][name="' + _selName + '"]');
                        var checked = inputs.filter(':checked');

                        if(options.onChange){
                           
                            options.onChange(checked.toArray().map(a => a.__data),  {
                                checked: check.checked, 
                                data: check.__data
                            })
                        }
            
                        if(checked.length === inputs.length){
                            rootCheckbox.checked = true;
                            rootCheckbox.indeterminate = false;
                        } else if(checked.length === 0) {
                            rootCheckbox.checked = false;
                            rootCheckbox.indeterminate = false;
                             
                        } else {
                            rootCheckbox.checked = false;
                            rootCheckbox.indeterminate = true;
                        }
                    })
                    
                     
                } else {
                    check.type = 'radio'
                }

                th.prepend(thinp);
    
                
                tr.prepend(th);
            }
             
            tbody.append(tr);

             
            
            if(options.onRow){
                options.onRow.call(tr, tr, this)
            }
            if(options.showRoles){
                var td = document.createElement('td');
                td.id = id;
                tr.append(td);
                 
                $(td).append(displayRoles(this))
            }
            
        });

        wuic.run()

    },
    getAndRender: function (root, project, options) {
        this.get(project, function (users, roles) {
            w7.users.render(users, roles, root, options)
        })
    }
}
