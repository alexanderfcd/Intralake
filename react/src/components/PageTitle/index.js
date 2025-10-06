import React from 'react';

const wuic = window.wuic;
const w7 = window.w7;


class PageTitle extends React.Component {
    componentDidMount(){
        this.init();
    }

    init() {
        const scope = this;
        w7.$(w7).on('pageTitleChange', function (e, title) {
            scope.setTitle()
        })
    }

    getTitle() {
        return w7.pageTitle();
    }

    setTitle() {
        var curr = this.getTitle();
        document.title = curr ? curr + ' - IntraLake.' : 'IntraLake.';
        w7.$('.page-title').html(curr);
    }

    render() {
        this.setTitle();
         return <h3 className={'page-title ' + (this.props.className ? this.props.className : "page-title-default") }>{this.getTitle()}</h3>;
    };
}

export default PageTitle;
