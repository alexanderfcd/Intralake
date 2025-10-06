import React from 'react';
import PageTitle from "../components/PageTitle";
const w7view = window.w7view;
const w7 = window.w7;

class Projects extends React.Component {

    componentDidMount(){

        w7view.files.projectsView();
    }
    render() {
        return (
            <div className="projects-page">
                <PageTitle className={"projects-title"} />
                <section className='view view-projects'></section>
            </div>
        );
    }
}

export default Projects;
