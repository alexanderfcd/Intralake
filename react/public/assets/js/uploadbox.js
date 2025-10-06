wuic.uploadBoxListFiles = function(box){
    var scope = this;
    this.box = box;
    this.files = [];
    $('table', box).empty();
    this.boxState = function(){
        $(".upload-box-list")[this.files.length ? 'show':'hide']()
    };
    this.setState = function(file){

    };
    this.removeAll = function(){
        while(this.files.length) {
            this.removeFile(0)
        }
    };
    this.removeFile = function(fileIndexElement){
        if(typeof fileIndexElement === 'number'){
            var file = this.files[fileIndexElement];
            this.files.splice(fileIndexElement, 1);
        }
        else if(typeof fileIndexElement === 'object' && fileIndexElement.nodeType){
            var tr = $(fileIndexElement).parent().parent();
            var index = $(fileIndexElement).parents("table:first").find('tr.files-row').index(tr);
            var file = this.files[index];
            this.files.splice(index, 1);
        }
        else if(typeof fileIndexElement === 'object' && fileIndexElement.size){
            var file = fileIndexElement;
            var index = this.files.indexOf(file);
            this.files.splice(index, 1);
        }
        $(this).trigger('fileRemoved', [this.files, file])
    };
    this.fileExists = function (file) {
        return !!scope.files.find(function(a){return a.name === file.name});
    };

    this.progress = function (percent, i) {

        var progress = $('table', box).find('tr').eq(i).get(0).__progress;
        progress.show();

        progress.value(Math.max(5, percent))
    }

    this.addFiles = function(files, trigger){
        if(files.length){
            var i = 0;
            for( ; i< files.length; i++){
                if(this.fileExists(files[i])){
                    continue;
                }
                (function (item, scope, tempIndex) {
                    scope.files.push(item);
                    var tr = $('<tr data-i="'+i+'" class="files-row">');
                    var tdNameCell = document.createElement('td');



                    var tdProgress = document.createElement('span');

                    var prg = new il.progressbar();
                    prg.hide();
                    tr[0].__progress = prg
                    tdProgress.appendChild(prg.node)

                    var tdName = document.createElement('span');
                    tdName.innerHTML = item.name;
                    tdName.contentEditable = true;
                    tdName._time = null;

                    tdName.addEventListener('input', function(e){
                        clearTimeout(tdName._time);
                        tdName._time = setTimeout(function(){
                            var tr = $(tdName).parents('tr:first');
                            var index = tr.parent().find('tr').index(tr);
                            var nname = $(tdName).text().trim();
                            scope.files[index] = w7.objects.renameFile(item, nname);
                            $(scope).trigger('fileRenamed', [scope.files, scope.files[index]])
                        }, 777)

                    });

                    $(tdName).on('keydown keyup', function(e){
                        if(e.keyCode === 13) return false;
                    });
                    $(tdName).on('paste', function(e){
                        e.preventDefault();
                        var text = (e.originalEvent || e).clipboardData.getData('text/plain');
                        document.execCommand("insertHTML", false, text);
                    });
                    $(tdName).attr('data-gramm_editor', false);
                    var editIcon = document.createElement('span');
                    editIcon.className = 'material-icons file-name-edit-icon';
                    editIcon.innerHTML = 'edit';
                    $(editIcon).on('click', function(e){
                        e.preventDefault();
                        $(tdName).focus()
                    });

                    $(tdNameCell).append(editIcon);
                    $(tdNameCell).append(tdName);
                    $(tdNameCell).append('<span class="error">'+lang('')+'</span>');
                    //$(tdNameCell).append('<div class="progress"><div></div></div>');
                    tr.append(tdNameCell);

                    var tdSize = document.createElement('td');
                    tdSize.className = 'upload-box-list-size-cell';
                    $(tdSize)
                        .append('<span class="files-row-size-label">' + w7.obSize(item.size) + '</span>')


                    tr.append(tdSize);

                    var delTd = $('<td>');
                    var delbtn = $('<span>');
                    delTd
                        .append(delbtn)
                        .append(tdProgress);
                    delTd.addClass('upload-box-list-delete-cell');
                    delbtn.addClass('material-icons upload-box-list-delete-cell-button');
                    delbtn.html('close');
                    tr.append(delTd);
                    delbtn.on('click', function () {
                        scope.removeFile(this);
                        $(this).parents('tr').animate({'opacity': 0}, function(){
                            $(this).remove()
                            $(scope).trigger('change', [scope.value]);
                        });
                    });
                    $('table', box).append(tr)
                })(files[i], this, i);
            }
            if (trigger) {
                $(scope).trigger('change', [scope.value]);
            }

        }
        this.boxState()
    }
};

wuic.uploadBox = function(opt){

    var scope = this;
    if(typeof opt.multiple === 'undefined') {
        opt.multiple = true;
    }
    this.box = opt.box;
    this.value = opt.value || [];
    this.list = opt.list;
    this.box.addEventListener("dragover",function(e){
        e.preventDefault();
        $(this).addClass('drag-over')
    },false);

    this.box.addEventListener("dragleave",function(e){
        e.preventDefault();
        $(this).removeClass('drag-over')
    },false);

    this.listFiles = new wuic.uploadBoxListFiles(scope.list);

    this.progress = function (percent, i) {
        return this.listFiles.progress(percent, i)
    }

    $(this.listFiles).on('fileRemoved fileRenamed', function (files, file) {
        scope.value = scope.listFiles.files;
        $(scope).trigger('change', [scope.value]);
        scope.filesClass();
    });

    this.box.addEventListener('drop', function (e) {
        $(this).removeClass('drag-over');
        e.preventDefault();
        var dt = e.dataTransfer;
        if(!opt.multiple){
            scope.listFiles.removeAll()
            $('tr', scope.listFiles.box).animate({'opacity': 0}, function(){
                $(this).remove()
            });
            scope.listFiles.addFiles([dt.files[0]]);
        } else {
            scope.listFiles.addFiles(dt.files);
        }
        scope.value = scope.listFiles.files;
        scope.filesClass();
        $(scope).trigger('change', [scope.value]);
    }, false);

    const input = $('input', this.box)

    
    .on("change", function(){
        if(!opt.multiple){
            scope.listFiles.removeAll()
            $('tr', scope.listFiles.box).animate({'opacity': 0}, function(){
                $(this).remove()
            });
        }
        scope.listFiles.addFiles(this.files)
        scope.value = scope.listFiles.files;
        scope.filesClass();
        $(scope).trigger('change', [scope.value]);
        this.value = null
    });
    
    input[0].multiple = opt.multiple;

    input.click();

    this.filesClass = function(){
        if(scope.value.length){
            $(this.box).addClass('has-files');
        }
        else{
            $(this.box).removeClass('has-files');
        }
    }

};

