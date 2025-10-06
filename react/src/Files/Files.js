import React from 'react';
import ILEditor from "../components/ILEditor";

const tableView = window.tableView;
const wuic = window.wuic;
const w7 = window.w7;
const w7view = window.w7view;

const deleteMany = () => {
    var ids = [];
    w7.each('.wui-select-icon input', function (){
        if(this.checked) {
            ids.push(this.value);
        }
    });
    w7.objects.deleteMany(ids);
}

const multiSelect = (el) => {

    var node = document.querySelector('#selectall-check');

    w7.each('#table-view-body input', function (){
        this.checked = node.checked;
    })

    w7view.files.tblvMultiselect()
}

const refresh = () => {
    return window.refreshCurrent()
}


function Files() {
    setTimeout(() => {
        tableView();

    }, 10);
    return (
        <div className="view-files-holder">

            <div className="context-root-menu">
                <button className="wui-btn wui-btn-icon" wtip="Refresh" onClick={()=>{refresh()}}> <i className="material-icons">refresh</i></button>
                <div className="view-files-multiselect-menu">

                    <button className="wui-btn wui-btn-icon" data-perm="deleteObject"  wtip="Delete" onClick={()=>{deleteMany()}}> <i className="material-icons">delete</i></button>
                </div>
            </div>

            <div className="no-results" id="main-table-viewno-results" style={{display:'none'}}></div>
            <div className="responsive-table">
                <table className="wui-table wui-table-sortable" id="main-table-view">
                    <colgroup>
                        <col width="30" />
                    </colgroup>
                    <thead>
                    <tr>
                        <th> <label className="wui-check"><input type="checkbox" id="selectall-check" onInput={()=>{multiSelect(this)}} /></label></th>
                        <th></th>
                        <th></th>
                        <th className="th-sortable" data-sort="name"><span>Name</span></th>

                        <th className="th-sortable" data-sort="author"><span>Author</span></th>
                        <th className="th-sortable active" data-sort="date"><span>Date</span></th>
                        <th className="th-sortable" data-sort="version"><span>Version</span></th>
                        <th className="th-sortable" data-sort="public"><span>Public</span></th>
                        <th>Options</th>
                    </tr>
                    </thead>
                    <tfoot>
                    <tr>
                        <td>  </td>
                        <td></td>
                        <td></td>
                        <td><span>Name</span></td>

                        <td ><span>Autdor</span></td>
                        <td ><span>Date</span></td>
                        <td ><span>Version</span></td>
                        <td ><span>Public</span></td>
                        <td>Options</td>
                    </tr>
                    </tfoot>
                    <tbody id="table-view-body">

                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Files;
