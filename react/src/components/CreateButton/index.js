import React from 'react';

const wuic = window.wuic;
const w7 = window.w7;



class CreateButton extends React.Component {
    componentDidMount(){
        this.init();
    }

    init() {
        w7.$('.folder-add-section').not('.ready').each(function(){
            let el = w7.$(this);
            el.addClass('ready');
            w7.$('.a-object-upload-new', el).on('click', function(){
                w7.objects.uploader()
            });
            w7.$('.a-object-new-document', el).on('click', function(){
                w7.objects.object('document')
            })
            w7.$('.a-object-new-folder', el).on('click', function(){
                w7.objects.object()
            });
            w7.$('.a-object-new-department', el).on('click', function(){
                w7.objects.object('department')
            });
            w7.$('.a-object-new-project', el).on('click', function(){
                w7.project.create()
            });
        })
    };


    render() {

        return <div className="folder-add-section" data-perm="createObject">
            <div className="wui-dropdown">
                <button className="wui-btn wui-btn-outline-prime"><i className="material-icons">add</i></button>
                <ul>
                    <li className="a-object-upload-new" data-perm="createObject"><i className="material-icons">cloud_upload</i> Upload file</li>

                    <li className="a-object-new-document" data-perm="createObject"><i className="material-icons">description</i>Create Document</li>
                    <li className="a-object-new-folder" data-perm="createObject"><i className="material-icons">folder</i>Create Folder</li>
                    <li className="a-object-new-department" data-perm="createObject"><i className="material-icons">corporate_fare</i>Create Department</li>
                    {/*<li className="a-object-new-project"><i className="material-icons">create_new_folder</i> Project
                    </li>*/}
                </ul>
            </div>
        </div>
    };
}

export default CreateButton;
