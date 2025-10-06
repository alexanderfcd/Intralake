import React from 'react';

const w7 = window.w7;


function P404() {
    const id = 'page-404 react-view-' + new Date().getTime();
    return (
        <div className={id}>
            <h5><lang>The requested URL was not found on this server</lang>.</h5>
            <a href='/' className='wui-btn'><lang>Go to home page</lang></a>
        </div>
    );

}

export default P404;
