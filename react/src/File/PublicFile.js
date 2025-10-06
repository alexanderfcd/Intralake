import React from 'react';


const objectView = window.objectView;
const getPathParam = window.getPathParam;

const w7 = window.w7;


class PublicFile extends React.Component {
    componentDidMount() {
        w7.view.rend('file', '.section-object', function () {

            objectView(getPathParam('object'), getPathParam('v'), 'public');
            w7.each('.object-info .wtab', function (){
                if(this.classList.contains('object-info-wtab')) {
                    this.classList.add('active')
                } else {
                    this.remove()
                }
            })
            w7.each('.object-info .wtab-nav, .ov-context, .object-preview-data-tabs', function (){
                this.remove()
            });
        });

    }

    render() {

        return (
            <section>
                <div className="section-object section-object-public">

                </div>
            </section>
        );
    }
}

export default PublicFile;
