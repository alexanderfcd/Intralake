import React from 'react';

const w7 = window.w7;


function Login() {
    const id = 'react-view-' + new Date().getTime();
    setTimeout(function () {
        w7.view.rend('login', '.' + id);
    }, 10);
    return (
        <div className={id}></div>
    );

}

export default Login;