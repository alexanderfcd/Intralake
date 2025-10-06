w7._tooltipCalc = function (node) {
    var el = $(node), off = el.offset(), tw = w7.$tooltip.outerWidth();
    var posY = off.top - w7.$tooltip.outerHeight() - 5;
    if(posY<0) {
        posY = off.top + el.outerHeight()
    }
    var posX = (off.left + (el.outerWidth()/2)) - (tw/2)
    if(posX < 0){
        posX = 0;
    }
    if((posX + tw) > $(window).width()){
        posX = $(window).width() - tw;
    }
    return {
        left: posX,
        top: posY,
        display: ''
    }

};
w7._tooltip = function (content, node) {
    if(!w7.$tooltip){
        var el = document.createElement('div')
        el.className = 'w7-system-tooltip';
        $('body').append(el).on('mousedown touchstart', function (e){
            var tt = document.querySelector('.w7-system-tooltip');

            tt.classList.remove('active')

        });
        w7.$tooltip = $(el);
        w7.event.on('route', (e, params, prevparams) => {
            var tt = document.querySelector('.w7-system-tooltip');
            tt.style.display = 'none'
        })
    }
    if(!content || !node) return;

    var el = $(node);
    w7.$tooltip.html(content);

    w7.$tooltip
        .css(w7._tooltipCalc(node))
        //.css(w7._tooltipCalc(node))
        .addClass('active');
    if(!node._tooltipe){
        node._tooltipe = true;
        $(node).on('mouseleave', function () {
            w7.$tooltip.removeClass('active');
        })
    }
};
