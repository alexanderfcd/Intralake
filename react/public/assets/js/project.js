w7.project = {
    postCreate: function(data) {
        data = data || {};
        var xhr = w7.bearerPost(w7.apiurl('/project'), data);
        return xhr;
    },
    getById: function(id, c){
        var xhr = w7.bearerGet(w7.apiurl('/project/' + (id || '')), function(data){
            if(c){
                c.call(xhr, data)
            }
        });
        return xhr;
    },
    create: function() {
        var footer = w7.modalFooter();
        var modal = new w7.modal({
            content: $(".tpl-project").html(),
            height: 100,
            footer: footer.footer,
            title: lang('Create project')
        });
        var time = null;
        $('#project-name', modal.modalContainer).on('input', function(){
            footer.ok.disabled = false;
            clearTimeout(time);
            time = setTimeout(function () {

            }, 333);
        });

        footer.cancel.onclick = function () {
            modal.remove()
        };
        $(footer.ok).html(lang('Create')).attr('disabled', true);
        footer.ok.onclick = function () {
            wuic.loading(true);
            var name = document.getElementById('project-name').value;
            w7.project.postCreate({
                name: name
            }).done(function(){

                w7.xhr.user(function(userResp){
                    w7.storage('userData', userResp);
                    if($('.tree').length) {
                        wuic.treeView.reload();
                        tableView()
                    } else if($('.view-projects').length){
                        w7view.files.projectsView();
                    }

                    wuic.loading(false);
                });


            });
            modal.remove();
        };
    }
};
