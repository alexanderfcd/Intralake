
import React from 'react';
const wuic = window.wuic;
const w7 = window.w7;



class AccessGroupEdit extends React.Component {

    componentDidMount() {
        w7.view.rend('access-group-edit', '#access-group-edit', function(){

        })
    }
    render() {
        return (
            <div>
                <div id="access-group-edit"></div>
            </div>
        )
    }
}

export default AccessGroupEdit;