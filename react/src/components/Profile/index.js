import React from 'react';

const w7 = window.w7;


function Profile() {
    const id = 'react-view-' + new Date().getTime();

    setTimeout(function () {
        w7.view.rend('profile', '.' + id, () => {


            w7.xhr.user(function(userResp){
                w7.storage('userData', userResp);
                const data = (w7.storage('userData'));
                w7.$('[type="text"],textarea,select', '#profile-block').each(function () {
                    w7.$(this).val(data[this.name])
                });
                w7.internalUploader({
                    element: '#profile-image',
                    label: 'Upload Image',
                    value: (data.image && data.image !== 'false') ? (data.image) : false
                });
             });


            w7.pageTitle('Profile')
        });
    }, 10);

    return (
        <div className={id}></div>
    );

}

export default Profile;
