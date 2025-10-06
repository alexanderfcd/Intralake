wuic.comments = {
    edit: function (id, content, c) {
        var xhr = w7.bearerPut(w7.apiurl('comment'), {id:id, content:content}, function(data){
            if(c){
                c.call(xhr,data)
            }
        });
        return xhr;
    },
    remove: function (id, c) {
        w7.confirm(lang('Delete comment') + '?', function (confirmed) {
            var xhr = w7.bearerDelete(w7.apiurl('comment') + '/' + id, function(data){
                var el = $('#comment-'+id);
                if(c){
                    c.call(xhr,data)
                }
                el.remove()
            });
        })
    },
    get: function (id, c, page = 1) {
        var xhr = w7.bearerScopeGet(w7.apiurl('/comments/') + id + '?page=' + page)
            .done(function (data) {
                if(c) {
                    c.call(xhr, data)
                }
            });
        return xhr;
    },
    editUI:function (id) {
        var el = $('#comment-'+id);
        var cont = $(".comment-content", el)

        var btn = $(".init-edit-comment-btn", el);
        var area = $("textarea", el);
        var savebtn = $(".savebtn-edit-comment-btn", el);
        var cancelbtn = $(".cancelbtn-edit-comment-btn", el);
        if(el.hasClass('isedit')){
            el.removeClass('isedit');
            btn.show();
            cont.show();
            area.hide();
            savebtn.hide()
            cancelbtn.hide()
        }
        else{
            el.addClass('isedit');
            cont.hide();
            btn.hide();
            if(area.length){
                area.show()
                savebtn.show()
                cancelbtn.show();
                setTimeout(function () {
                    area.focus()
                },10)
            }
            else{
                var area = $("<textarea>");

                var savebtn = $("<span class='wui-btn wui-btn-prime savebtn-edit-comment-btn'>Update</span>", el);
                var cancelbtn = $("<span class='wui-btn-link cancelbtn-edit-comment-btn'>Cancel</span>", el);
                cancelbtn.on('click', function () {
                    wuic.comments.editUI(id);
                });
                savebtn.on('click', function () {

                    wuic.comments.edit(id, area.val(), function(){
                        wuic.comments.editUI(id);
                        cont.html(area.val());
                    })
                });
                el.append(area);
                el.append(savebtn);
                el.append(cancelbtn);
                wuic.textAreaAutoHeight(area[0]);
                setTimeout(function () {
                    area.focus()
                },10)
            }
            area.val(cont.text())

        }
    },
    single: function (obj) {
        var el = document.createElement('div');
        el.id = 'comment-' + obj._id;

        var _name = window.currentUser && currentUser._id == obj.author._id ? lang('Me') : displayName(obj.author);
        var name = $('<span class="comment-name">'+_name+'</span>');
        var date = $('<span class="comment-ago">'+userDate(obj.date)+'</span>');
        var content = $('<span class="comment-content">'+obj.content+'</span>');


        $(el)
            .addClass('single-comment')
            .append(name)
            .append(date)
            .append(content);
        var user = w7.storage('userData');
        if(user && user._id == obj.author._id) {
            $(el).append($('.tpl-comment-options').html())
            var editBthn = $('.a-comment-edit', el);
            var delBthn = $('.a-comment-delete', el);
            editBthn.on('click', function () {
                wuic.comments.editUI(obj._id);
            });
            delBthn.on('click', function () {
                wuic.comments.remove(obj._id);
            });

        }
        return el;
    },
    init: function(id, page){
        var clist =  document.querySelector(".comments-list");
        if(!clist) return;
        while(clist.firstChild) {
            clist.removeChild(clist.firstChild)
        }
        var scope = this;
        this.get(id, function(data){
            var frag = document.createDocumentFragment();
            const comments = data.comments.data || [];
            const total =  data.comments.paging.total;
            var noComment = document.createElement('p');
            var label;
            if(total === 0) {
                label = lang('No comments');
            } else if(total === 1) {
                label = lang('1 comment')
            } else {
                label = total + ' ' + lang('comments');
            }
            noComment.innerHTML =  label;
            frag.append(noComment);

            data.comments.data.forEach(function(node){
                frag.appendChild(scope.single(node))
            });
            while(clist.firstChild) {
                clist.removeChild(clist.firstChild)
            } 
            clist.append(frag);
            const pg = w7view.files.createPaginator(data.comments.paging, undefined, (page) => {
           
                scope.init(id, page)
            });
             
            clist.append(pg);
            wuic.run();
        }, page)
    }
};
