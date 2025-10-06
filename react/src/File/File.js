import React from 'react';
import ILEditor from "../components/ILEditor";


const objectView = window.objectView;
const getPathParam = window.getPathParam;
const getObject = window.getObject;
const w7 = window.w7;
const $ = window.$;
const wuic = window.wuic;
let loggedIn = !!w7.getStorageToken();

class File extends React.Component {

    componentWillReceiveProps() {
        this._init()
    }

    componentDidMount() {
        this._init()
    }

    _init() {
            w7.view.rend('file', '.section-object', function(){
                objectView(getPathParam('object'), getPathParam('v'));
                wuic.path.init('#path');
                w7.$("#form-comments [name='id']").val(getObject());
                loggedIn = !!w7.getStorageToken();
                if(loggedIn){
                    w7.$("#form-comments").show()
                }

                $("#form-comments [name='id']").val(getObject());
                wuic.textAreaAutoHeight($('#form-comments [name="comment"]')[0])
                $(w7).on('commentCreated', function () {
                    wuic.comments.init(getObject());
                    $('#form-comments [name="comment"]').val('');
                    $('#form-comments button')[0].disabled = false;
                });

                $('#form-comments textarea')
                    .on('input', function () {
                        var val = $(this).val().trim();
                        if(!val) {
                            $("#form-comments button").attr('disabled', true)
                        }
                        else {
                            $("#form-comments button").removeAttr('disabled')
                        }
                    })
                    .on('focus', function () {
                        $("#form-comments").addClass('focus-like');
                        var val = $(this).val().trim();
                        if(!val) {
                            $("#form-comments button").attr('disabled', true)
                        }
                        else {
                            $("#form-comments button").removeAttr('disabled')
                        }
                    });
                $('#form-comments .wui-btn-link').on('click', function () {
                    $("#form-comments").removeClass('focus-like');
                    $('#form-comments textarea').val('')
                });
                $('#form-comments textarea').on('blur', function () {
                    var val = $(this).val().trim();
                    if(!val) {
                        $("#form-comments").removeClass('focus-like')
                        $("#form-comments button").attr('disabled', true)
                    }
                    else {
                        $("#form-comments button").removeAttr('disabled')
                    }
                });
            })


    }


    render() {

        return (
            <section>
                <div className="section-object">
                    <ILEditor></ILEditor>
                </div>
            </section>
        );
    }
}

export default File;
