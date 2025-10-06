import React from 'react';

const w7 = window.w7;


function ResetPassword() {
    const id = 'react-view-' + new Date().getTime();
    setTimeout(function () {
        w7.view.rend('reset-password', '.' + id);
    }, 10);
    return (
        <div className={id}></div>
    );

}

export default ResetPassword;
