w7.view = {
    _views:{},
    _viewpath:'/assets/views',
    load: function(view, callback){
        if(!w7.view._views[view]){
          this.getByXHR(this._viewpath + '/' + view + '.html', function(data){
              w7.view._views[view] = data;
              callback.call(data, data);
          })
        } else {
            callback.call(this._views[view], this._views[view]);
        }
    },
    getByXHR: function(view, callback){
        // return w7.scopeGet(view, undefined, callback, {dataType: 'text'})
        return w7.get(view, undefined, callback, 'text')
    },
    _rend: function (selector, data) {
        if(selector.indexOf('<') !== -1){
            data = selector;
            selector = 'section.view';

        }
        $(selector).empty().append(data).trigger('viewChanged');
        __attrLang();
    },
    rend: function(view, selector, callback) {
        if(!selector){
            selector = 'section.view'
        }
        if(typeof selector === 'function'){
            callback = selector;
            selector = 'section.view'
        }

        this.load(view, function (data) {
            w7.view._rend(selector, w7.view.prepareData(data));
            if(callback){
                callback.call()
            }
            wuic.run()
            setTimeout(function () {
                wuic.run()
            }, 378);
        });
    },
    _parser: document.createElement('div'),
    prepareData: function(data){
        this._parser.innerHTML = data;
        return this._parser.innerHTML;
    }
};
