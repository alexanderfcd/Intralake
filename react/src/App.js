import React from 'react';
import Projects from './Projects/Projects';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import TemplatesBlock from './components/Templates';
import ProjectConfig from './components/ProjectConfig';
import EditRole from './components/EditRole';
import ProjectSettings from './components/ProjectSettings';
import ProjectUsers from './components/ProjectUsers';
import AccessGroups from './components/AccessGroups';
import AccessGroupEdit from './components/AccessGroupEdit';
import Tree from './components/Tree';

import Path from './components/Path';
import CreateButton from './components/CreateButton';
import P404 from './components/404';
import Roles from './components/Roles';
import Files from './Files/Files';
import File from './File/File';
import { Route, Redirect, Switch } from 'react-router';
import {GlobalData} from "./store";
import PageTitle from "./components/PageTitle";
import Profile from "./components/Profile";
import Search from "./components/Search";
import PublicFile from "./File/PublicFile";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./Dashboard/Dashboard";
import StreamPost from "./StreamPost";
import StreamPosts from "./StreamPosts";
import RestorePassword from "./components/RestorePassword";
import StreamVideos from "./StreamVideos";
import StreamVideo from "./StreamVideo";


const w7 = window.w7;


const loggedIn = !!w7.getStorageToken();
const getPathParams = window.getPathParams;
const getPathParam = window.getPathParam;
const getProject = window.getProject;
const setPath = window.setPath;

const renderIfLoggedOrObjectIsPublic = async (component, params) => {
    return new Promise((resolve) => {
        const token = w7.getStorageToken();
        if (token) {
            resolve(renderIfLogged(component, params))
        } else {

        }
    });
}
const renderIfLogged = (component, params) => {
    params = params || {};
    if(!!w7.getStorageToken()) {

        return React.createElement(component, params);
    } else {
        return React.createElement(Redirect, {to: w7.loginURL()});
    }
};

const toHome = () => {
    if(w7.Config.home && !!w7.getStorageToken() && w7.Config.home !== '/') {
        w7.service.goto('home')
    } else {

        return renderIfLogged(Projects)
    }

}

const renderIfLoggedElse = (component, altcomponent) => {
     if(!!w7.getStorageToken()) {
        return React.createElement(component);
    } else {
        return React.createElement(altcomponent);
    }
};

const renderIfNotLogged = (component, params) => {
    params = params || {};
    if(!loggedIn) {
        return React.createElement(component, params);
    } else {
        return React.createElement(Redirect, {to: '/'});
    }
};

class App extends React.Component {

    componentDidMount() {

        w7._reacthistory = this.props.history;
        var prevparams = getPathParams();
        w7._reacthistory.listen(function(route){
            var params = getPathParams();
            w7.pageTitle(null)
            w7.$.each(params, function(a,b){
                if(params[a] !== prevparams[a]){
                    w7.event.dispatch('route',  a, [route, params[a], prevparams[a]]);
                }
            });
            w7.$.each(prevparams, function(a,b){
                if(!params[a]){
                    w7.event.dispatch('route', a, [route, params[a], prevparams[a]]);
                }
            });
            w7.event.dispatch('route', [route, params, prevparams]);
            prevparams = params;
            w7.__dataActive();

        });

        w7.__dataActive();
    }

    goto(where, param) {
        return w7.service.goto(where, param)
    }

    render() {
      return (
          <GlobalData.Provider>
            <div className="app">
            <div className="wui-card wui-component wui-card-in" id="main-block">

                <Header props={this.props}  />
                <div className="app-main">
                    <Switch>
                        <Route exact path="/" render={() => toHome() } />
                        <Route path="/login" render={() => renderIfNotLogged(Login) } />
                        <Route path="/register" render={() => renderIfNotLogged(Register) } />
                        <Route path="/reset-password" render={() => renderIfNotLogged(ResetPassword) } />
                        <Route path="/restore-password" render={() => renderIfNotLogged(RestorePassword) } />

                        <Route exact path="/profile" render={() => renderIfLogged(Profile) } />

                        <Route exact path="/dashboard/project/:id" render={() => renderIfLogged(Dashboard) } />

                        <Route path="/project/">

                            <div >

                            <div className="app-bar" data-perm="$accessProject">
                                <div className="main-grid">
                                    <div className="main-grid-side-1">

                                    </div>
                                    <div className="main-grid-content">
                                        <div className="main-grid-content-flex">
                                            <CreateButton />
                                            <Search />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="main-grid">

                                    <div className="main-grid-side-1">
                                        <Tree />
                                        <span className="main-tree-mobile-menu">
                                            <span className="material-icons">menu</span>
                                        </span>
                                    </div>
                                    <div className="main-grid-content">
                                        <div className="actions-head">
                                            <Path />
                                        </div>
                                        <Route exact path="/project/:id" render={() => renderIfLogged(Files) } />

                                        <Route exact path="/project/:id/folder/:folder_id" render={() => renderIfLogged(Files) } />
                                        <Route exact path="/project/:id/object/:object_id" render={() => renderIfLoggedElse(File, PublicFile) } />
                                        <Route exact path="/project/:id/object/:object_id/edit" render={() => renderIfLoggedElse(File, PublicFile) } />
                                        <Route exact path="/project/:id/object/:object_id/v/:version_id" render={() => renderIfLoggedElse(File, PublicFile) } />

                                    </div>
                                </div>
                                </div>
                        </Route>
                        <Route path="/admin">
                            <div className="admin-block">
                                <div className="admin-menu">
                                    <ul>
                                        <li><a data-perm="$manageProject" data-active="settings" onClick={() => this.goto('projectSettings')}>Project settings</a></li>
                                        <li><a data-perm="modifyRole" data-active="roles" onClick={() => this.goto('projects')}>Roles</a></li>
                                        <li><a data-perm="modifyRole" data-active="users" onClick={() => this.goto('projectUsers')}>Users</a></li>
                                        <li><a data-perm="modifyRole" data-active="access-groups" onClick={() => this.goto('AccessGroups')}>Access Groups</a></li>
                                    </ul>
                                </div>
                                <div className="admin-content">
                                    <PageTitle />
                                    <Route exact path="/admin/:id" render={() => renderIfLogged(ProjectConfig) } />
                                    <Route exact path="/admin/:id/users" render={() => renderIfLogged(ProjectUsers) } />
                                    <Route exact path="/admin/:id/access-groups" render={() => renderIfLogged(AccessGroups) } />
                                    <Route exact path="/admin/:id/access-group/:id" render={() => renderIfLogged(AccessGroupEdit) } />
                                    <Route exact path="/admin/:id/roles" component={() => renderIfLogged(Roles) } />
                                    <Route exact path="/admin/:id/roles/:perm_id" render={() => renderIfLogged(EditRole) } />
                                    <Route exact path="/admin/:id/settings" render={() => renderIfLogged(ProjectSettings) } />

                                </div>
                            </div>
                        </Route>
                        <Route path="/pt/:id/action/"  render={() => renderIfLogged(StreamPosts) } />

                        <Route path="/pt/:id/stream-posts"  render={() => renderIfLogged(StreamPosts) } />
                        <Route path="/pt/:id/create-stream-post"  render={() => renderIfLogged(StreamPost) } />
                        <Route path="/pt/:id/edit-stream-post/:post"  render={() => renderIfLogged(StreamPost) } />


                        <Route path="/pt/:id/stream-videos"  render={() => renderIfLogged(StreamVideos) } />
                        <Route path="/pt/:id/create-stream-video"  render={() => renderIfLogged(StreamVideo) } />
                        <Route path="/pt/:id/edit-stream-video/:post"  render={() => renderIfLogged(StreamVideo) } />


                        <Route path="/404" component={P404} />
                        <Redirect to="/404" />
                    </Switch>
                </div>
                <TemplatesBlock />
            </div>
                <footer className='app-holder' id="footer">
                    <address>&copy; IntraLake. All rights reserved.</address>
                    <nav><a href="//intralake.com" target="_blank">IntraLake.com</a> </nav>
                </footer>
            </div>
          </GlobalData.Provider>
      );
    }
}

export default App;
