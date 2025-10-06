$(document).ready(function(){

    var currentProject = null;
    router
        .on({
            'project/:id': function (params) {
                w7.viewData = {};
                tableView();
                /*wuic.tree.init('#view-tree', function () {
                    wuic.path.init('#path')
                });*/
                currentProject = params.id;
            },
            'folder/:id': function () {
                w7.viewData = {};
                tableView();
                wuic.path.init('#path');
            },
            'object/:id': function (params) {
                w7.viewData = {};
                if (w7.getStorageToken()) {
                    objectView(params.id);
                    wuic.path.init('#path');
                    $("#form-comments [name='id']").val(getObject());
                }
                else {
                    w7.xhr.logged(function (logged) {
                        currentUser = logged;
                        if(logged){
                            $("#form-comments").show();
                        }

                        objectView(params.id);
                        wuic.path.init('#path');
                        $("#form-comments [name='id']").val(getObject())
                    });
                }
            },
            'object/:id/v/:version': function (params) {
                w7.viewData = {};
                if(w7.currentUserData) {
                    objectView(params.id, params.version);
                    wuic.path.init('#path');
                    $("#form-comments [name='id']").val(getObject())
                }
                else {
                    w7.xhr.logged(function (logged) {
                        currentUser = logged;
                        if(logged){
                            $("#form-comments").show()
                        }

                        objectView(params.id, params.version);
                        wuic.path.init('#path');
                        $("#form-comments [name='id']").val(getObject())

                    });
                }
            },
            '*': function () {
                w7.viewData = {};
                w7view.files.projectsView();
                //wuic.path.init('#path');
            }
        })
        .resolve();
});
