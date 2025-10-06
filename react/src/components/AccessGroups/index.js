import React from 'react';
import {Link} from 'react-router-dom';
const wuic = window.wuic;
const w7 = window.w7;

const setPath = window.setPath;
const getProject = window.getProject;



class AccessGroups extends React.Component {

    componentDidMount() {
        w7.accessGroups.getAndRender('#access-groups-root');
    }
    render() {
        return (
            <div>
                <a onClick={() => setPath('/admin/' + getProject() + '/access-group/' + 0)} className="wui-btn wui-btn-outline"> {w7.lang('Create Access group')} </a>
                <br/>
                <br />
                <div id="access-groups-root"></div>
            </div>
        )
    }
}

export default AccessGroups;