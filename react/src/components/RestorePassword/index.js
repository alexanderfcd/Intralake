import React from 'react';

const w7 = window.w7;


function RestorePassword() {
    const id = 'restore-password';
    setTimeout(function () {
        if (window.location.search && window.location.search.indexOf('token=') !== -1) {
            w7.view.rend('restore-password', '.' + id);
        }

    }, 10);
    return (
        <div className={id}></div>
    );

}

export default RestorePassword;
