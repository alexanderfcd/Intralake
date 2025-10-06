
import React from 'react';
const wuic = window.wuic;
const w7 = window.w7;
const getProject = window.getProject;
const getPathParam = window.getPathParam;

class EditRole extends React.Component {


    populate() {
        w7.role.rendRoles()
    }

    componentDidMount(){
        const scope = this;
        w7.view.rend('role', '#edit-role-section', function () {
            scope.populate();
            wuic.tabs();
            if(w7.win.location.pathname.split('/').pop().indexOf('add') === -1) {
                w7.$('.view-role-edit .wtab-nav').show()
            }
        });
    }

    render() {
        return (
            <div id="edit-role-section"></div>
        );
    }
}

export default EditRole;
