
/*****************************************************************

Usage;

  let Handler = new CoolEvents();


  Handler.on('somethingHappend', ()=>{

  });
  Handler.on('somethingHappend.here', ()=>{

  });

  Handler.off('somethingHappend');
  Handler.off('somethingHappend.here');

  Handler.on('somethingHappend.There', (data, index, text)=>{
    console.log(data, index, text)
  });

  Handler.dispatch('somethingHappend'); // trigger event to all 'somethingHappend' hadlers

  Handler.dispatch('somethingHappend', [{user:1}, 99, 'cool stuff']);  // trigger event to all 'somethingHappend' hadlers with data

  Handler.dispatch('somethingHappend.There');   // triggers only 'somethingHappend.There' hadler

******************************************************************/



class CoolEvents {
  constructor(){
    this._events = {}
    this.on = (customEventName, callback) => {
       let parts = customEventName.split('.'),
           eventName = parts[0],
           calledFrom = parts[1] || ('' + new Date().getTime());
       this._events[eventName] = this._events[eventName] || {};
       this._events[eventName][calledFrom] = this._events[eventName][calledFrom] || callback;
     }
     this.off = (customEventName) => {
       let parts = customEventName.split('.'),
           eventName = parts[0],
           calledFrom = parts[1];
       if(!!calledFrom && !!this._events[eventName]){
        delete this._events[eventName][calledFrom];
       }
       else{
        delete this._events[eventName]
       }
     }
     this.dispatch = (customEventName, data) => {
       let parts = customEventName.split('.'), params = [undefined];
       if(typeof data !== 'undefined'){
         params.push(data);
       }
       let name = parts[0];
       if(!!this._events[name]){
         if(parts.length === 2){
           if(!!this._events[name][parts[1]]) {
             this._events[name][parts[1]].call(...params)
           }
         }
         else{
           for (let item in this._events[name]){
             this._events[name][item].call(...params)
           }
         }
       }
     }
  }
}
