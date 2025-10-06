
import React from 'react';
import {Link} from 'react-router-dom';
const wuic = window.wuic;
const w7 = window.w7;
const getProject = window.getProject;
let test = 1;

class Roles extends React.Component {


    addRole() {

    }

    doRender() {

        w7.view.rend('roles', '.view-roles', function () {
            w7.roles.getAndRender('#roles-table');
            w7.pageTitle(w7.lang('Roles'));
        });
    }

    componentDidMount() {
        this.doRender();
    }


    render() {


        return (
            <div>
                <div className="view-roles"></div>
            </div>
        );
    }
}

export default Roles;