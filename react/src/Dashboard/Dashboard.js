import React from 'react';

const tableView = window.tableView;
const wuic = window.wuic;
const w7 = window.w7;
const w7view = window.w7view;


function Dashboard() {


    w7.bearerGet(w7.apiurl('/project/' + w7.getProject() + '/dashboard'), {}, function(data){
        var inf = document.getElementById('dashboard-info');
        inf.innerHTML = `
        Number of files: <b>${data.project.totalFiles}</b> <br>
        Number of folders: <b>${data.project.totalFolders}</b><br>
        Project size: <b>${w7.obSize(data.project.totalSize)}</b><br>
        Number of file versions: <b>${data.project.totalVersions}</b><br>
        `;


        var act = document.getElementById('dashboard-activity');
        var comm = document.getElementById('dashboard-comments');

        var actPage = 2;
        var actPageStop = false;
        var loading = false;

        act.addEventListener('scroll', event => {
            var element = event.target;
            if ((element.scrollHeight - (element.scrollTop + 100)) <= element.clientHeight) {
                if(!loading && !actPageStop) {
                    loading = true;
                    w7.bearerGet(w7.apiurl('/project/' + w7.getProject() + '/dashboard/activity?page=' + actPage), {}, function(data){
                        if(data.length === 0) {
                            actPageStop = true;
                            return
                        }
                        actPage++;
                        data.forEach(function (item){
                            var li = document.createElement('li');

                            var ext = '';
                            if(item.action === 'rename') {
                                ext = ' <a onclick="setPath(\'/project/'+w7.getProject()+'/object/'+item.object+'\');return false;" href="/project/'+w7.getProject()+'/object/'+item.object+'">from <b>' + item.previousName + '</b> to <b>' + item.name + '</b></a>'
                            } else if(item.action === 'create') {
                                ext =  ' <a onclick="setPath(\'/project/'+w7.getProject()+'/object/'+item.object+'\');return false;" href="/project/'+w7.getProject()+'/object/'+item.object+'"><b>' + item.name + '</b></a>'
                            }


                            li.innerHTML = `<span wtip="${new Date(item.date).toLocaleString()}">${item.ago}</span> ${w7.displayName(item.author)} has ${item.action}d ${item.subtype || item.type}${ext}`;
                            act.appendChild(li);
                        })
                        loading = false;
                    })
                }
            }
        });


        data.activity.forEach(function (item){
            var li = document.createElement('li');

            var ext = '';
            if(item.action === 'rename') {
                ext = ' <a onclick="setPath(\'/project/'+w7.getProject()+'/object/'+item.object+'\');return false;" href="/project/'+w7.getProject()+'/object/'+item.object+'">from <b>' + item.previousName + '</b> to <b>' + item.name + '</b></a>'
            } else if(item.action === 'create') {
                ext =  ' <a onclick="setPath(\'/project/'+w7.getProject()+'/object/'+item.object+'\');return false;" href="/project/'+w7.getProject()+'/object/'+item.object+'"><b>' + item.name + '</b></a>'
            }


            li.innerHTML = `<span wtip="${new Date(item.date).toLocaleString()}">${item.ago}</span> ${w7.displayName(item.author)} has ${item.action}d ${item.subtype || item.type}${ext}`;
            act.appendChild(li);
        })


        data.comments.forEach(function (item){
            var li = document.createElement('li');
            li.setAttribute('wtip', new Date(item.date).toLocaleString())
            li.innerHTML = `${item.ago} ${w7.displayName(item.author)} has commented on ${item.post?.name}`;
            comm.appendChild(li);
        })
    })
    return (
        <div className="dashboard-wrapper">
            <ul id="dashboard-info" className='dashboard-activity'></ul>
            <div className='dshb-row'>
                <ul id="dashboard-activity" className='dashboard-activity'></ul>
                <div id="dashboard-comments" className='dashboard-activity'></div>
            </div>
        </div>
    );
}

export default Dashboard;
