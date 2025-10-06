
import React from 'react';
import {Link} from 'react-router-dom';
const wuic = window.wuic;
const w7 = window.w7;
const getProject = window.getProject;
let test=1;

class ProjectSettings extends React.Component {

    doRender() {
        w7.view.rend('project-settings', '.project-settings', function () {
            w7.bearerGet(w7.apiurl('/project/' + getProject()), {}, function(data){
                w7.$('#project-name').val(data.name)
                w7.$('#project-description').val(data.description)
                w7.internalUploader({element: '#project-image-update', value: (data.image && data.image !== 'false') ? (data.image) : false});
                w7.pageTitle(w7.lang('Project settings'));
            })
        });
    }

    componentDidMount() {
        this.doRender();
    }

    render() {
        return (
            <div>
                <div className="project-settings"></div>
            </div>
        );
    }
}

export default ProjectSettings;