import React from 'react';

const w7 = window.w7;


function Register() {
    const id = 'react-view-' + new Date().getTime();
    setTimeout(function () {
        w7.view.rend('register', '.' + id);
    }, 10);
    return (
        <div className={id}></div>
    );

}

export default Register;
