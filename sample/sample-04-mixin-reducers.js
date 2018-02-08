import {ReducerWrapper, StoreWrapper} from '../src/redux-wrapper-extended.js';


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
  


var reducers = ReducerWrapper.combine({
    count: finalCountReducerWrapper.getReducer(),
  });

var state = {
  count:0
};


const storeWrapper = new StoreWrapper(reducers,state);




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
