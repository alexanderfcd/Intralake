var _header = function () {

    var _isLogged = function () {
        return !!w7.getStorageToken();
    }
    var _isNotLogged = function () {
        return !w7.getStorageToken();
    }

    var _isLoggedAndConfirmed = function () {
        return _isLogged() && w7.storage('userData').confirmed;
    }

    return w7.el({
        tag: 'header',
        className: 'header',
        content: {
            className: 'header-main',
            content: [
                {
                    ...il.config.logo
                },
                {
                    className: 'user-header-menu',
                    content: {
                        className: 'wui-dropdown',
                        content: [
                            {
                                tag: 'a',
                                href: '/billing',
                                className: 'wui-btn wui-btn-outline',
                                id: 'header-tokens-button',
                                innerHTML: `${w7.storage('userData')?.appTokens || 0} ${il.icon('token')}`,
                                guard: _isLoggedAndConfirmed,
                            },
                            {
                                tag: 'button',
                                className: 'wui-btn wui-btn-lite',
                                innerHTML: '<i class="material-icons">account_box</i><i class="material-icons">arrow_drop_down</i>'
                            },
                            {
                                tag: 'ul',
                                hookStart: 'header-user-menu-start',
                                hookEnd: 'header-user-menu-end',
                                content: [
                                    {
                                        tag: 'li',
                                        content: {
                                            tag: 'a',
                                            innerHTML: 'My projects',
                                            dataset: {
                                                link: '/'
                                            },

                                        },
                                        guard: _isLoggedAndConfirmed
                                    },
                                    {
                                        tag: 'li',
                                        content: {
                                            tag: 'a',
                                            innerHTML: 'Billing',
                                            href: '/billing',
                   

                                        },
                                        guard: _isLoggedAndConfirmed
                                    },
                                    {
                                        tag: 'li',
                                        content: {
                                            tag: 'a',
                                            innerHTML: 'Profile',
                                            
                                                href: '/profile'
                                            

                                        },
                                        guard: _isLoggedAndConfirmed
                                    },

                                    {
                                        tag: 'li',
                                        content: {
                                            tag: 'a',
                                            innerHTML: 'Log out',
                                            on: {
                                                click: function (e) {
                                                    w7.goToLogin(true)
                                                }
                                            }
                                        },
                                        guard: _isLogged
                                    },
                                    {
                                        tag: 'li',
                                        content: {
                                            tag: 'a',
                                            innerHTML: 'Log in',
                                            on: {
                                                click: function (e) {
                                                    w7.goToLogin(true)
                                                }
                                            }
                                        },
                                        guard: _isNotLogged
                                    },
                                    {
                                        tag: 'li',
                                        content: {
                                            tag: 'a',
                                            innerHTML: 'Register',
                                            on: {
                                                click: function (e) {
                                                    location.href = '/register'
                                                }
                                            }
                                        },
                                        guard: _isNotLogged
                                    },


                                ]
                            }
                        ]
                    }
                }
            ]
        }
    })
}
var _headerCreated = false;
var Header = function (state) {
    if(typeof state === 'undefined') {
        state = true;
    }
    if(!_headerCreated) {
        _headerCreated = _header();
        document.getElementById('app').prepend(_headerCreated)
    }
    if(state) {
        _headerCreated.style.display = '';
    } else {
        _headerCreated.style.display = 'none';
    }

}
Header()
