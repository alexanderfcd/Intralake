import React from 'react';
const tableView = window.tableView;
const wuic = window.wuic;
const w7 = window.w7;
const goToFolder = window.goToFolder;
const goToProject = window.goToProject;

class Tree extends React.Component {
    componentDidMount(){



        wuic.treeView = new wuic.Tree({
            element: '#tree-view',
            onSelect: function (obj, node) {
                goToFolder(obj._id, obj.project);
            },
            onProjectSelect: function(obj, node) {
                goToProject(obj._id);
                w7.service.setSearchPlaceholder(obj)
            },
            onProjectSwitch: function(obj, node) {
                goToProject(obj._id);
                w7.service.setSearchPlaceholder(obj)
            }

        });
        w7.$('.main-tree-mobile-menu').on('mousedown touchstart', function () {
            w7.$(this).parent().toggleClass('tree-mobile-active')
        })

    }
    render () {
        return <div id="tree-view"></div>
    };
}
export default Tree;
