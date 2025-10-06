w7.user = {
    _lang: 'en',
    getLang:function(c){
        delete window.LANG;
        var script = document.createElement('script');
        script.onload = function () {
            if(c) c.call()
        };
        script.src = something;
        document.head.appendChild(script);
    }
};