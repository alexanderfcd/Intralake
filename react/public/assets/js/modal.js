w7.__modals = [];
w7.modal = function(options){
    var scope = this;
    options.content = options.content || '';

    this.options = options;
    this.options.removeOnRouteChange = typeof this.options.removeOnRouteChange === 'undefined' ? true : this.options.removeOnRouteChange;
    this.id = this.options.id || 'w7-modal-' + new Date().getTime();
    this.options.id = this.id;
    this.options.overlay = typeof this.options.overlay === 'undefined' ? true : this.options.overlay;
    this.options.overlayClose = typeof this.options.overlayClose === 'undefined' ? false : this.options.overlayClose;
    this.options.autoCenter = typeof this.options.autoCenter === 'undefined' ? true : this.options.overlayClose;
    this.options.autoFocus = typeof this.options.autoFocus === 'undefined' ? true : this.options.autoFocus;
    this.options.vAlign = typeof this.options.vAlign === 'undefined' ? 'top' : this.options.vAlign;


    w7.__modals.push(this);

    this.title = function(){
        if(this.options.title){
            this.modalHeader = document.createElement('div');
            this.modalHeader.className = 'w7-modal-header';
            $(this.modalHeader).append(this.options.title);
            this.modalHolder.appendChild(this.modalHeader);
        }
    };
    this.footer = function(){
        if(this.options.footer){
            this.modalFooter = document.createElement('div');
            this.modalFooter.className = 'w7-modal-footer';
            $(this.modalFooter).append(this.options.footer);
            this.modalHolder.appendChild(this.modalFooter)
        }
    };
    this.build = function(){
        this.modalHolder = document.createElement('div');
        this.modalHolder.__dialog = this;
        this.modalHolder.className = 'w7-modal-holder';
        this.modalContainer = document.createElement('div');
        var cls = !this.options.className ? '' : ' '+ this.options.className;
        this.modalContainer.className = 'w7-modal-container' + cls;
        this.title();
        $(this.modalContainer).append(this.options.content);

        this.modalHolder.appendChild(this.modalContainer);

        this.closeButton = document.createElement('div');
        this.closeButton.className = 'w7-modal-close';

        this.closeButton.scope = this;

        this.closeButton.onclick = function(){
            this.scope.remove();
        };

        this.modalHolder.appendChild(this.closeButton);

        this.footer();

        this.width(this.options.width || 600);
        this.height(this.options.height || 320);

        document.body.appendChild(this.modalHolder);

        if(this.options.autoFocus){
            setTimeout(function(){
               const _input = scope.modalHolder.querySelector('input[type="text"], input[type="email"], textarea')

               if(_input) {
                _input.focus({
                    preventScroll: true,
                });
               }
            
               
            }, 100)
        }

        return this;
    };

    this.setSize = function(){

    };

    this.modalOverlay = function(){
        this.overlay = document.createElement('div');
        this.overlay.className = 'w7-modal-overlay';
        this.overlay.scope = this;
        if(this.options.overlay === true){
            document.body.appendChild(this.overlay);
        }
        this.overlay.addEventListener('click', function(){
            if (scope.options.overlayClose === true) {
                scope.remove()
            }
        });

        return this;
    };

    this.show = function(){
        this.overlay.classList.add('active');
        this.modalHolder.classList.add('active');
        this.center();
        return this;
    };

    this.hide = function(){
        this.overlay.classList.remove('active');
        this.modalHolder.classList.remove('active');
        return this;
    };

    this.remove = this.destroy = function(){
        this.hide();
        this.overlay.remove();
        this.modalHolder.remove();
        return this;
    };


    this.center = function(){

        var htop;
        if(this.options.vAlign === 'center') {
            htop = innerHeight/2 -  this.modalHolder.offsetHeight/2;
        } else if(this.options.vAlign === 'top') {
            htop = 20;
        }

        htop = htop > 20 ? htop : 20;
        this.modalHolder.style.left = (innerWidth/2 -  this.modalHolder.offsetWidth/2) + 'px';
        this.modalHolder.style.top = (htop) + 'px';

        return this;
    };

    this.width = function(width){
        if(typeof width === 'number') {
            width = width + 'px';
        }
        this.modalContainer.style.width = width;
    };
    this.height = function(height){
        if(typeof height === 'number') {
            height = height + 'px';
        }
        this.modalContainer.style.height = height;
    };

    this.content = function(content){
        this.options.content = content || '';
        this.modalContainer.innerHTML =  this.options.content;
        return this;
    };

    this.init = function(){
        this.modalOverlay();
        this.build();
        this.center();
        (function(scope){
            setTimeout(function(){
                scope.show();
                wuic.run()
            }, 10);
        })(this);


        if(this.options.autoCenter){
            (function(scope){
                window.addEventListener('resize', function(){
                    scope.center()
                });
            })(this);
        }
        return this;
    };
    this.init();

};


w7.nameConflictDialog = function (config, callback) {
    var footer = w7.modalFooter();
    var result = {};
    var modal = new w7.modal({
        content: document.querySelector('.name-conflict-dialog').innerHTML,
        width:420,
        height:160,
        footer: footer.footer,
        title: config.title || lang('Object name already exists')
    });
    footer.ok.disabled = true;

    footer.cancel.onclick = function () {
        modal.remove()
    };
    footer.ok.onclick = function () {
        callback.call(undefined, value());
        modal.remove()
    };

    function value() {
      var field = $('[name="name-conflict-dialog-action"]:checked', modal.modalContainer).val();
      var fieldMore;
      if (field === 'rename') {
          fieldMore = $('[name="new-name-field"]', modal.modalContainer).val().trim();
      }
      return {
          field: field,
          fieldMore: fieldMore
      }
    }

    var time = null;

    function validate(call, errCall) {
        footer.ok.disabled = true;
        var val = value();
        var result;
        clearTimeout(time);
        time = setTimeout(function () {
            if ( val.field === 'rename' ) {
                if ( val.fieldMore === config.name ) {
                    result = lang('Object name already exists');
                    errCall.call(undefined, result);
                } else {
                    w7.objects.validName(val.fieldMore, config.to || config.folder, function(valid){
                        if (valid) {
                            call.call(undefined, valid)
                        } else {
                            result = lang('Object name already exists');
                            errCall.call(undefined, result);
                        }
                    });
                }
            } else {
                call.call(undefined, true)
            }
        }, 777);
    }

    modal.modalContainer.querySelector('[name="new-name-field"]').addEventListener('input', function(){
        validate(
            function () {
                footer.ok.disabled = false;
            },
            function (err) {
                wuic.warn(err)
            }
        )
    })

    modal.modalContainer.querySelector('.name-conflict-dialog-action').style.display = 'none';

    var namearr = config.name.split('.');
    var ext = namearr.pop();
    var filename = namearr.join('.');
    var fname = filename ? (filename + '-' + new Date().getTime() + '.' + ext) : config.name;
    w7.each('.name-conflict-dialog-action-rename input', modal.modalContainer, function (){
        this.value = fname
    })

    w7.each('[name="name-conflict-dialog-action"]', modal.modalContainer, function (){
        this.addEventListener('input', function () {
            $('.name-conflict-dialog-action', modal.modalContainer).hide();
            $('.name-conflict-dialog-action-' + this.value, modal.modalContainer).show();
            if(this.value === 'rename') {
                $('[name="new-name-field"]', modal.modalContainer).focus().trigger('input');
            } else{
                footer.ok.disabled = false;
            }
        });
    })


    wuic.run();
    return modal;
};



w7.modalFooter = function(okData, cancelData){
    okData = okData || {};
    cancelData = cancelData || {};
    var footer = document.createElement('div');
    footer.className = 'system-dialog-footer';
    var ok = document.createElement('button');
    var cancel = document.createElement('button');

    ok.type = 'button';
    ok.className = 'wui-btn wui-btn-prime';
    ok.innerHTML = okData.text || lang('ok');
    cancel.innerHTML = cancelData.text || lang('cancel');
    cancel.className = 'wui-btn wui-btn-outline';
    cancel.type = 'button';

    footer.appendChild(cancel);
    footer.appendChild(ok);
    return {
        footer: footer,
        ok: ok,
        cancel: cancel
    };
};
w7.confirm = function(q, c){
    if(typeof q === 'function'){
        c = q;
        q = "Are you sure?"
    }

    q = '<div class="system-dialog-content"><div>' + q + '</div></div>';



    var footer = w7.modalFooter();

    var modal = new w7.modal({
        content: q,
        width:420,
        height:140,
        footer: footer.footer,
        title: lang('Confirm')
    });

    footer.ok.onclick = function(){
        modal.remove();
        c.call();
    };

    footer.cancel.onclick = function(){
        modal.remove();
    };
    setTimeout(function () {
        footer.cancel.focus();
    },22);

    return modal;
};
