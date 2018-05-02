import {ReducerWrapper, StoreWrapper, combineReducerWrapper} from '../src/redux-wrapper-extended.js';


const countReducer1Wrapper = new ReducerWrapper(2) // this initial value is simply ignored
  .addHandler("INCREMENT",(state,payload)=>{
    return state + payload;
  })
  .addHandler("DECREMENT",(s,p)=>{
    return s - p;
  })
const countReducer2Wrapper = new ReducerWrapper(1) // this initial value is simply ignored
  .addPropChangedHandler("SET_VALUE");

const finalCountReducerWrapper = new ReducerWrapper(0)
  .withHandlersFromOtherReducerWrappers([
    countReducer1Wrapper,
    countReducer2Wrapper
  ]);



var reducers = combineReducerWrapper({
    count: finalCountReducerWrapper.getReducer(),
  });



var state = {
  count:0
};


var storeWrapper = new StoreWrapper(reducers,state);




var store = storeWrapper.getStore();
store.subscribe(() => {
  console.log("Store changed", store.getState());
});

// set count to 10
console.log("SET_VALUE TO 10");
storeWrapper.dispatch("SET_VALUE",10);
// add 3 to current state
console.log("INCREMENT 3");
storeWrapper.dispatch("INCREMENT",3);
// subtract 2 from current state
console.log("DECREMENT 2");
storeWrapper.dispatch("DECREMENT",2);

var anotherReducerWrapper = ReducerWrapper.importFrom(reducers, null)

anotherReducerWrapper.addHandler("MULTIPLIED_BY",(state,payload)=>{
  return {
    count: state.count * payload
  }
})



storeWrapper = new StoreWrapper(anotherReducerWrapper.getReducer(),{
  count: 300
});
store = storeWrapper.getStore();
store.subscribe(() => {
  console.log("Store changed", store.getState());
});

// add 3 to current state
console.log("INCREMENT 3");
storeWrapper.dispatch("INCREMENT",3);
// subtract 2 from current state
console.log("DECREMENT 2");
storeWrapper.dispatch("DECREMENT",2);

console.log("MULTIPLIED BY 4");
storeWrapper.dispatch("MULTIPLIED_BY",4);

