
import React from 'react';
const wuic = window.wuic;
const w7 = window.w7;

export default () => {
    setTimeout(() => {
        wuic.tree.init('#view-tree', function () {
            wuic.path.init('#path')
        });
    }, 10);
    return (
        <ul id="view-tree" className="tree"></ul>
    );
}