
var offset = function (curr) {

    var rect = curr.getBoundingClientRect();
    var res = {
        top: rect.top + pageYOffset,
        bottom: rect.bottom + pageYOffset,
        left: rect.left + pageXOffset,
        width: rect.width,
        height: rect.height,
    }
    return res;
};

window.wuic = {
    createSelect: function (conf){
        var input = document.createElement('select');
        var holder = document.createElement('div');
        holder.className = 'field-holder';
        input.name = conf.name || 'il-' + Math.random().toString(36).substr(2, 9);
        conf.data.forEach(function (item){
            var option = document.createElement('option');
            option.value = item._id;
            option.innerHTML = item.name;
            if (item.disabled) {
                option.disabled = true
            }
            if (item.selected || conf.selected === item._id || conf.data.length === 1) {
                option.selected = true;
            }
            input.appendChild(option);
        });
        input.className = 'wui-field';
        if (conf.label) {
            var label = document.createElement('label');
            label.innerHTML = conf.label;
            holder.appendChild(label)
        }
        holder.appendChild(input)
        return {holder: holder, input: input, label: label}
    },
    createInput: function (conf){
        var input = document.createElement('input');
        var holder = document.createElement('div');
        holder.className = 'field-holder';
        input.type = conf.type || 'text';
        input.name = conf.name || 'il-' + Math.random().toString(36).substr(2, 9);
        input.className = 'wui-field';
        if (conf.label) {
            var label = document.createElement('label');
            label.innerHTML = conf.label;
            holder.appendChild(label)
        }
        holder.appendChild(input)
        return {holder: holder, input: input, label: label}
     },
    preload: function(state, node, overlay) {
        node = node || document.body;
        overlay = overlay || false;

        if(node.__state === state) return;
        node.__state = state;

        if(state) {
            // $(node).addClass('state-loading').append('<div class="preload"></div>');
            $(node).addClass('state-loading').append('<div class="gpreload"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="margin:auto;display:block;" width="45px" height="45px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"><g transform="translate(50 50)"><g transform="translate(-19 -19) scale(0.6)"><g><animateTransform attributeName="transform" type="rotate" values="0;45" keyTimes="0;1" dur="0.2s" begin="0s" repeatCount="indefinite"></animateTransform><path d="M31.359972760794346 21.46047782418268 L38.431040572659825 28.531545636048154 L28.531545636048154 38.431040572659825 L21.46047782418268 31.359972760794346 A38 38 0 0 1 7.0000000000000036 37.3496987939662 L7.0000000000000036 37.3496987939662 L7.000000000000004 47.3496987939662 L-6.999999999999999 47.3496987939662 L-7 37.3496987939662 A38 38 0 0 1 -21.46047782418268 31.35997276079435 L-21.46047782418268 31.35997276079435 L-28.531545636048154 38.431040572659825 L-38.43104057265982 28.531545636048158 L-31.359972760794346 21.460477824182682 A38 38 0 0 1 -37.3496987939662 7.000000000000007 L-37.3496987939662 7.000000000000007 L-47.3496987939662 7.000000000000008 L-47.3496987939662 -6.9999999999999964 L-37.3496987939662 -6.999999999999997 A38 38 0 0 1 -31.35997276079435 -21.460477824182675 L-31.35997276079435 -21.460477824182675 L-38.431040572659825 -28.531545636048147 L-28.53154563604818 -38.4310405726598 L-21.4604778241827 -31.35997276079433 A38 38 0 0 1 -6.999999999999992 -37.3496987939662 L-6.999999999999992 -37.3496987939662 L-6.999999999999994 -47.3496987939662 L6.999999999999977 -47.3496987939662 L6.999999999999979 -37.3496987939662 A38 38 0 0 1 21.460477824182686 -31.359972760794342 L21.460477824182686 -31.359972760794342 L28.531545636048158 -38.43104057265982 L38.4310405726598 -28.53154563604818 L31.35997276079433 -21.4604778241827 A38 38 0 0 1 37.3496987939662 -6.999999999999995 L37.3496987939662 -6.999999999999995 L47.3496987939662 -6.999999999999997 L47.349698793966205 6.999999999999973 L37.349698793966205 6.999999999999976 A38 38 0 0 1 31.359972760794346 21.460477824182686 M0 -23A23 23 0 1 0 0 23 A23 23 0 1 0 0 -23" fill="#1187fd"></path></g></g><g transform="translate(19 19) scale(0.6)"><g><animateTransform attributeName="transform" type="rotate" values="45;0" keyTimes="0;1" dur="0.2s" begin="-0.1s" repeatCount="indefinite"></animateTransform><path d="M-31.35997276079435 -21.460477824182675 L-38.431040572659825 -28.531545636048147 L-28.53154563604818 -38.4310405726598 L-21.4604778241827 -31.35997276079433 A38 38 0 0 1 -6.999999999999992 -37.3496987939662 L-6.999999999999992 -37.3496987939662 L-6.999999999999994 -47.3496987939662 L6.999999999999977 -47.3496987939662 L6.999999999999979 -37.3496987939662 A38 38 0 0 1 21.460477824182686 -31.359972760794342 L21.460477824182686 -31.359972760794342 L28.531545636048158 -38.43104057265982 L38.4310405726598 -28.53154563604818 L31.35997276079433 -21.4604778241827 A38 38 0 0 1 37.3496987939662 -6.999999999999995 L37.3496987939662 -6.999999999999995 L47.3496987939662 -6.999999999999997 L47.349698793966205 6.999999999999973 L37.349698793966205 6.999999999999976 A38 38 0 0 1 31.359972760794346 21.460477824182686 L31.359972760794346 21.460477824182686 L38.431040572659825 28.531545636048158 L28.53154563604818 38.4310405726598 L21.460477824182703 31.35997276079433 A38 38 0 0 1 6.9999999999999964 37.3496987939662 L6.9999999999999964 37.3496987939662 L6.999999999999995 47.3496987939662 L-7.000000000000009 47.3496987939662 L-7.000000000000007 37.3496987939662 A38 38 0 0 1 -21.46047782418263 31.359972760794385 L-21.46047782418263 31.359972760794385 L-28.531545636048097 38.43104057265987 L-38.431040572659796 28.531545636048186 L-31.35997276079433 21.460477824182703 A38 38 0 0 1 -37.34969879396619 7.000000000000032 L-37.34969879396619 7.000000000000032 L-47.34969879396619 7.0000000000000355 L-47.3496987939662 -7.000000000000002 L-37.3496987939662 -7.000000000000005 A38 38 0 0 1 -31.359972760794346 -21.46047782418268 M0 -23A23 23 0 1 0 0 23 A23 23 0 1 0 0 -23" fill="#89c2fa"></path></g></g></g></svg></div>');
            if(overlay) {
                var ocss = '';
                if(typeof overlay === 'string') {
                    ocss = 'background-color:' + overlay;
                }
                $(node).append('<div class="preload-overlay" style="'+ocss+'"></div>');
            }
        } else {
            $(node).removeClass('state-loading').find('.preload, .preload-overlay, .gpreload').remove()
        }
    },
    _dropdown: false,
    tabs: function(){
        $('.wtabs').not('.wtabs-ready').each(function () {
            var dis = $(this);
            dis.addClass('wtabs-ready');
            var btns = dis.children('.wtab-nav').find('span')
            var tabs = dis.children('.wtab')
            btns.on('click', function(){
                btns.not(this).removeClass('active');
                var i = btns.index(this);
                $(this).addClass('active');
                tabs.not(tabs[i]).removeClass('active')
                tabs.eq(i).addClass('active')
            })
        })
    },

    dropdown: function(){
        if(!this._dropdowns){
            this._dropdowns = [];
            document.body.addEventListener('click', function(e){
                var hasDropdown = false, target = e.target;
                 while(target && target !== this) {
                    if(target.classList.contains('wui-dropdown')) {
                        hasDropdown = target;
                        break;
                    }
                    target = target.parentNode;
                }
                if(!hasDropdown) {
                    var ul = wuic._dropdowns[0];

                    while(ul) {
                        ul.classList.remove('active')
                        if(document.body.contains(ul.__parent)) {
                            ul.__parent.appendChild(ul)
                        } else {
                            ul.remove()
                        }
                        wuic._dropdowns.shift()
                        ul = wuic._dropdowns[0];
                    }
                    var nodes = document.querySelectorAll(".wui-dropdown.active");
                    var i2 = 0, l2 = nodes.length;
                    for( ; i2 < l2 ; i2 ++ ) {
                        var node2 = nodes[i2];
                        node2.classList.remove('active');

                    }
                }
            })
        }

        var nodesAbsolute = document.querySelectorAll(".wui-dropdown-absolute:not(.ready)");
        if (nodesAbsolute.length) {
            var i = 0, l = nodesAbsolute.length;
            for( ; i < l ; i ++ ) {
                var node = nodesAbsolute[i];
                node.classList.add('ready');
                var ul = node.querySelector('ul');

                if(!ul) {
                    continue;
                }

                var btn = node.querySelector('button,.wui-dropdown-btn')

                if(!btn) {
                    continue;
                }

                w7.__permsTrack(ul)
                if(!ul.innerHTML.trim()){
                    btn.disabled = true;
                }

                ul.classList.add('wui-dropdown-list-abs');
                ul.__parent = node;
                (function (ul, btn){
                    btn.addEventListener('click', function(e){
                        e.preventDefault();
                        e.stopPropagation();
                         
                        var ul1 = wuic._dropdowns[0];

                     
                        
                        
                        var max = 0;

                        while(ul1) {
                     
                            if(ul1 === ul) {
                                wuic._dropdowns.shift()
                                ul1 = wuic._dropdowns[0];
                                continue;
                            }
                            ul1.classList.remove('active')
                            if(document.body.contains(ul1.__parent)) {
                                ul1.__parent.appendChild(ul1)
                            } else {
                                ul1.remove()
                            }
                            wuic._dropdowns.shift()
                            ul1 = wuic._dropdowns[0];
                        }

                            document.body.appendChild(ul)
                            wuic._dropdowns.push(ul)
                            ul.classList.add('state-calc')
                            var off = offset(btn);
                            var offul = offset(ul);
                            var dh =  (innerHeight + document.documentElement.scrollTop);
                            var dw = Math.max(document.documentElement.clientWidth, document.documentElement.scrollWidth);
                            var posTop = off.top;
                            var posLeft = off.left;

                            if((off.top + offul.height) > dh) {
                                posTop = posTop - ((off.top + offul.height) - dh)
                            }
                            if((posLeft + offul.width) > dw) {
                                posLeft = posLeft - ((off.left + offul.width) - dw)
                            }
                            ul.style.left = posLeft + 'px';
                            ul.style.top = posTop  /*+ off.height*/ + 'px';
                        ul.classList.remove('state-calc')
                        ul.classList.add('active')

                    });
                })(ul, btn)
            }
        }
        var nodes = document.querySelectorAll(".wui-dropdown:not(.ready)");
        if (nodes.length) {
            var i2 = 0, l2 = nodes.length;
            for( ; i2 < l2 ; i2 ++ ) {
                var node2 = nodes[i2];
                node2.classList.add('ready');
                var ul2 = node2.querySelector('ul');
                if(!ul2) {
                    continue;
                }
                var btn2 = node2.querySelector('button,.wui-dropdown-btn');
                var ul = node2.querySelector('ul');

                ul.addEventListener('click', function (){
                    this.parentNode.classList.toggle('active')
                })
                if(!btn2) {
                    continue;
                }
                w7.__permsTrack(ul2)


                    if(!ul2.innerHTML.trim()){
                        btn2.disabled = true;
                    }

                btn2.addEventListener('click', function(e){
                    e.preventDefault()
                    e.stopPropagation()
                    var nodes = document.querySelectorAll(".wui-dropdown.active");
                    var i2 = 0, l2 = nodes.length;
                    for( ; i2 < l2 ; i2 ++ ) {
                        var node2 = nodes[i2];
                        if(node2 !== this.parentNode){
                            node2.classList.remove('active');
                        }
                    }
                    this.parentNode.classList.toggle('active')
                });
            }
        }

    },
    loading: function (state, msg) {
        msg = msg || (lang('Loading') + '...');
        if(!this.loader){
            this.loader = document.createElement('div');
            this.loader.className = 'loader';
            $(document.body).append(this.loader)
        }
        if(state) this.loader.innerHTML = msg;
        $(this.loader)[ state ? 'addClass' : 'removeClass' ]('active');
    },
    _notification: function(text, style, options){
        options = options || {};
        var defaults = {
            position:'center-bottom',
            style: 'info'
        };
        var settings = $.extend({}, defaults, options);
        if(style){
            settings.style = style;
        }
        var el = document.createElement('div');
        el.className = 'wuic-notification wuic-notification-' + settings.style + ' wuic-notification-' + settings.position;
        el.innerHTML = text;
        document.body.appendChild(el);
        setTimeout(function(){
            $(el).addClass('active');
            setTimeout(function(){
                $(el).removeClass('active');
                setTimeout(function(){
                    $(el).remove();
                }, 400);
            }, 3000);
        }, 10)
    },
    notify:function(text){
        return this._notification(text);
    },
    error:function(text){
        return this._notification(text, 'error');
    },
    warn:function(text){
        return this._notification(text, 'warn');
    },
    errors: {
        objectExists: lang('Object with this name already exists')
    },
    textAreaAutoHeight: function (el) {
        if(!el || !el.style) return;
        if(el._autoheight) return;
        el._autoheight = true;
        el.className += ' notransition';
        el.style.height = '0';
        el.style.height = (el.scrollHeight) + 'px';
        $(el).on('input', function(){
            setTimeout(function(){
                el.style.height = '0';
                el.style.height = (el.scrollHeight) + 'px';
            },0);
        });
        setTimeout(function(){
            el.style.height = '0';
            el.style.height = (el.scrollHeight) + 'px';
        },0);
    },
    checkbox: function() {
        $('.wui-check')
            .not('.wui-check-ready')
            .each(function(){
            var svg = '' +
                '<svg width="12" height="12" viewBox="0 0 245 173" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <polyline stroke="#ffffff" class="wui-check-checkmark" stroke-width="35" points="5.640625 83.7607422 83.2539062 161.663086 238.97168 6.11328125"></polyline>\n' +
                '    </g>\n' +
                '</svg>';
            var svgRadio = '<i></i> ';
            var $this = $(this).addClass('wui-check-ready');
            var input = $this.find('input');
            var isCheckbox = input[0].type === 'checkbox';
            $this.addClass('type-' + input[0].type);
            input.after('<span>'+(isCheckbox ? svg : svgRadio)+'</span>');
        })
    },
    programaticDropdown: function (options) {

        var holder = document.createElement('div');
        holder.className = 'wui-dropdown';
        var button = document.createElement('button');
        button.className = 'wui-btn';

        var ul = document.createElement('ul');
        options = options || {};
        options.items = options.items || [];
        options.placeholderPrefix = options.placeholderPrefix || '';
        button.innerHTML = options.placeholder;

        this.value = null;
        this.onChange = function (item) {
         }
        this.holder = holder;
        this.button = button;
        this.ul = ul;

        var scope = this;
        scope.options = options;

        if(typeof scope.options.setDisplayValueOnChange === 'undefined') {
            scope.options.setDisplayValueOnChange = true;
        }

        var fill = function (item, node, prefix) {
             prefix = prefix || ''
            if(prefix) prefix += ' ';
            var icon = '';
            if (item.icon) {
                icon += '<i class="material-icons">' + item.icon+'</i> ';
            }
            var content = prefix + item.content;
            var desc = item.description ? ('<span class="wui-dropdown-item-description">'+item.description+'</span>') : '';
            node.innerHTML = icon + '<span class="wui-dropdown-item-content">' + content + desc + '</span>';
        }

        this.setValue = function (val, trigger) {
              scope.value = val !== undefined ? val : null;
             if (val === null || val === undefined) return;
            if (typeof scope.value.value === 'undefined') {
                scope.value = scope.options.items.find(function (item){
                    return item.value === scope.value;
                })
            }
            if(scope.options.setDisplayValueOnChange) {
                fill(scope.value, button, options.placeholderPrefix)
            }
            if (trigger) {
                scope.onChange(val)
            }

        }

        this.setValue(scope.options.value)



        for (var i = 0; i < scope.options.items.length; i++ ){
            var li  = document.createElement('li');
            var item = scope.options.items[i];
             li._value = item;
            fill(item, li)
            li.addEventListener("click",  function () {
                 scope.setValue(this._value, true)
            }, false);

            ul.appendChild(li)
        }

        holder.append(button)
        holder.append(ul);
        document.querySelector(scope.options.element).appendChild(holder)
        wuic.dropdown();

    }
};

wuic.run = function () {
    wuic.dropdown();
    wuic.tabs();
    wuic.checkbox();
};



$(window).on('load', function(){
    wuic.run()

});
$(document.body).ajaxStop(function(){
    setTimeout(function () {
        wuic.run()
    }, 300);
});
$(document).ready(function(){
    wuic.run()

});

