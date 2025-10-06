import React from 'react';
const wuic = window.wuic;
const w7 = window.w7;

class ProjectUsers extends React.Component {
    componentDidMount() {
        w7.view.rend('users', '.view-users', function () {
            w7.users.getAndRender('#users-table');
            w7.pageTitle(w7.lang('Users'));
        });
    }
    render() {
        return (
            <div>
                <div className="view-users"></div>
            </div>
        );
    }
}

export default ProjectUsers;