import React from 'react';
import {Link} from 'react-router-dom';
import './index.css';
 const w7 = window.w7;
const wuic = window.wuic;
const goToAdmin = window.goToAdmin;
const goToLogin = window.goToLogin;



class Header extends React.Component {



    handleRoute() {
        /*w7.event.on('route', (e, params, prevparams) => {
            console.log(e, params, prevparams)
        })
        w7.event.on('route', 'project', (e, params, prevparams) => {
            console.log(e, params)
        });*/
    }

    isLogged() {
        return !!w7.storage('userData');
    }

    logOut(){
        goToLogin(true)
    }

    logIn() {
        goToLogin()
    }


    userMenu() {
        return (
            this.isLogged() ? <a onClick={this.logOut}>Log Out</a> : <span onClick={this.logIn}>Log In</span>
        );
    }

    _change(e) {
        const file = e.target.files[0];


        var up = new w7.S3Uploader(file);
        up.upload(function (data){

        })
    }


    render() {
        this.handleRoute();
        return (
            <header className="header ">
                <div className="header-main">
                    <a className="navbar-brand" href={w7.Config.home}>IntraLake.</a>


                    {/*<input type="file" id="a" onInput={(e) => { this._change(e) }} />*/}


                     <div className="user-header-menu">

                         <div className="wui-dropdown">
                             <button className="wui-btn wui-btn-lite">
                                 <i className="material-icons">account_box</i>
                                 {/*{w7.storage('userData') ? w7.storage('userData').email : ''}*/}
                                 <i className='material-icons'>arrow_drop_down</i>
                             </button>
                             <ul>
                                 <li><Link to="/profile">Profile</Link></li>
                                 <li><Link to="/">My projects</Link></li>
                                 <li><a onClick={this.logOut}>Log Out</a></li>
                             </ul>
                         </div>
                    </div>

                </div>

            </header>
        );
    }
}

export default Header;
