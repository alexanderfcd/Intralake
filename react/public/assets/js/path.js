
 

wuic.path = {
    _curr: null,
    get:function(folder, callback){
        var xhr = w7.bearerGet(w7.apiurl('/path' + (folder ? '/' + folder:'')) + '?project=' + getProject(), function(data){
            callback.call(data, data)
        });
    },
    createAll:function(data){
        var html = $(), scope = this;
 
        $.each(data, function(a, b){


          

            html.push(scope.createSingleItem(this, a === data.length - 1));
        });
        return html;
    },
    createSingleItem:function(data, isLast){


        var span = document.createElement('div');
        span.id = 'path-item-' + data._id;
        span.className = 'path-item' + (isLast ? ' path-item-last' : '');
        span.dataset.disabled = data.disabled;
        if (!isLast) {
            span.innerHTML = data.name;
        } else {
            setTimeout(function () {
                var optionsDiv = $('<div class="wui-dropdown"></div>');

                const btn = document.createElement("button");
                btn.className = "wui-btn-icon";
                btn.disabled = data.disabled;
                btn.innerHTML = data.name;

                optionsDiv.append(btn);
                $(span).append(optionsDiv);
                optionsDiv.append(optionsMenu());

                var item = data;
                $("li", optionsDiv).each(function () {
                    this._$dataReflect = item;
                });
                if (item.type === 'folder') {
                    $(".a-object-upload-new-version", optionsDiv).remove()
                }

                if (item.subtype === 'department') {
                    $(".a-object-copy", optionsDiv).remove()
                    $(".a-object-move", optionsDiv).remove()
                }
                $(".a-object-upload-new-version", optionsDiv).on('click', function(){
                    w7.objects.uploadVersionDialog(item._id)
                });
                $(".a-object-manage-version", optionsDiv).on('click', function(){
                    w7.objects.manageVersion(item)
                });

                $(".a-object-manage-access", optionsDiv).on('click', function(){
                    w7.objects.manageAccess(item)
                });

                $(".a-object-rename", optionsDiv).on('click', function(){
                    w7.objects.renameObject(item)
                });
                $(".a-object-copy", optionsDiv).on('click', function(){
                    w7.objects.copyObject(item)
                });
                $(".a-object-move", optionsDiv).on('click', function(){
                    w7.objects.moveObject(item);
                });
                $(".a-object-delete", optionsDiv).on('click', function(){
                    w7.objects.delete(item);
                });
                wuic.run()
            }, 10)
        }
        var handleClick = function (e) {
            if (isLast) {

            } else {
                if(data._id === '_home_'){
                    goToHome()
                }
                else if(data.type === 'project'){
                    goToProject(data._id)
                } else if(data.type === 'folder'){
                    goToFolder(data._id);
                }
                else if(data._id){
                    goToObject(data._id);
                }
                else{
                    goToHome();
                }
            }
        }
        $(span).on('click', function(e){
            handleClick(e)
        });
        return span;
    },
    init: function(selector){
        var folder = getFolder();
        var object = getObject();
        var id = folder || object;
        var scope = this;
        if(this._curr === id) return;
        this._curr = id;


        const specials = ['favorites', 'trash'];

        if(specials.indexOf(folder) !== -1) {
            getCurrentProjectData(function (prj) {
                var tdata = [
                    {name: prj.name, _id: prj._id, type: 'project'},
                    {name: w7.lang(folder), _id: folder, type: 'folder', disabled: true},
                ]

                $(selector).empty().append(scope.createAll(tdata));
            });
    
        } else if (!id) {
            $(selector).empty();
            if (wuic.treeView) {
                wuic.treeView.applyPath( [{name: 'Home', _id: '_home_'}]);
            }
            getCurrentProjectData(function (prj) {
                w7.pageTitle(prj.name);
            });
        }
        else{
            this.get(id, function(tdata) {
                getCurrentProjectData(function (prj) {
                    w7.pageTitle(tdata[tdata.length - 1].name);
                    tdata.unshift({name: prj.name, _id: prj._id, type: 'project'});
                    wuic.path.current = tdata;
                    $(selector).empty().append(scope.createAll(tdata));
                    if(wuic.treeView) {
                        wuic.treeView.applyPath( tdata);
                    }
                });
            })
        }
    }
}
