import React from "react";

export class FlexContext {
    constructor() {
        this._data = {};
        this.off();
    }

    set(key, value, trigger) {
        trigger = trigger || typeof trigger === 'undefined';
        this._data[key] = value;
        if(trigger) {
            this.dispatch(this._data[key])
        }
    }

    get(key, immutable) {
        immutable = typeof mutable === 'undefined' || !!immutable;
        let res = this._data;
        if(immutable) {
            res = {...this._data}
        }
        if(key) {
            return res[key];
        }
        return res;
    }

    on(key, callback) {
        if(!this._events[key]){
            this._events[key] = [];
        }
        this._events[key].push(callback);
    }

    dispatch(key) {
        if(!this._events[key]){
            this._events[key] = [];
        }
        this._events[key].forEach(f => {
            f.call(undefined, this.get(key))
        })
    }

    off(key) {
        if(!key){
            this._events = {};
        } else {
            this._events[key] = [];
        }
    }
}

export const LakeStore = new FlexContext();

window.LakeStore = LakeStore;

export const GlobalData = React.createContext({api: {}});
