import React from 'react';

const w7 = window.w7;

class TemplatesBlock extends React.Component {
    render() {
        setTimeout(function () {
            w7.view.rend('templates', '.templates_block');
        }, 10);
        return (
            <div className="templates_block">

            </div>
        );
    }
}

export default TemplatesBlock;