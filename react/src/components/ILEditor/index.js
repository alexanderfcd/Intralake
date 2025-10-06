import React from 'react';
import { Editor } from '@tiptap/core'
import { defaultExtensions } from '@tiptap/starter-kit';


import Collaboration from '@tiptap/extension-collaboration'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'





const w7 = window.w7;
const wuic = window.wuic;


const button = function (opt) {
    const node = document.createElement('button');
    if (opt.icon) {
        node.innerHTML = '<i class="material-icons">'+opt.icon+'</i>';
    } else if (opt.content) {
        node.innerHTML = opt.content;
    }
    if (opt.tip) {
        node.setAttribute('wtip', opt.tip);
    }
    if (opt.action) {
        node.dataset.action = opt.action;
    }
    return node;
}

const editor = function (el, content) {
/*     const ydoc = new Y.Doc();
     const provider = new WebrtcProvider(w7.getObject(), ydoc);*/

     var currcontent = content;

    var editor = new Editor({
        element: el ,
        content: content,
        enableInputRules: true,
        enablePasteRules: true,
        transformPasted: true,
        extensions: [
            ...defaultExtensions(),
            /*Collaboration.configure({
                document: ydoc,
            }),*/
        ],
    });
    window.editor = editor;


    w7.each('.btn-editor-save', function (){
        this.onclick = function() {
            this.disabled = true;
            wuic.loading(true);
            const html = editor.getHTML();
            const blob = new Blob([html], { type: 'text/html' });
            w7.objects.uploadVersion({
                file: blob,
                id: w7.getObject(),
                folder: w7.getFolder(),
                action: 'edit',
                done: function () {
                    wuic.loading(false);
                    wuic.notify(w7.lang('Object updated'));
                }
            });
        }
    })



    var toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';

    const controlls = [
        {action: 'bold', tip: w7.lang('Bold'), icon: 'format_bold'},
        {action: 'italic', tip: w7.lang('Italic'), icon: 'format_italic'},
        {action: 'strike', tip: w7.lang('Strike'), icon: 'format_strikethrough'},
    ];

    controlls.forEach(function (ctrl){
        if(!ctrl.type || ctrl.type === 'button') {
            const btn = button({
                ...ctrl
            })
            btn.onclick = function () {
                const act = ctrl.action.charAt(0).toUpperCase() + ctrl.action.slice(1);
                editor.chain().focus()['toggle' + act]().run()
            }
            ctrl.button = btn;
            toolbar.append(btn)

        }
    })

    const manageStates = () => {
        controlls.forEach(function (ctrl){
            ctrl.button.classList[editor.isActive(ctrl.action) ? 'add' : 'remove']('active')
        });
    }

    editor.on('selectionUpdate', () => {
        manageStates()
    });

    editor.on('focus', () => {
        manageStates()
    });

    editor.on('update', (a,b) => {
        manageStates();
        if(currcontent !== editor.getHTML()) {
            w7.each('.btn-editor-save', function (){
                this.disabled = false;
            })
        }


    })
    w7.$(el).before(toolbar);

}


class ILEditor extends React.Component {

    id = 'il-editor-' + new Date().getTime();

    componentDidMount(){
        this.init();
    }

    init() {
        var el = document.querySelector('#' + this.id);
        // editor(el)

        w7.editor = editor;
     }

    render() {
         return <div className="w7-editor w7-editor-document" id={this.id}></div>;
    };
}

export default ILEditor;
