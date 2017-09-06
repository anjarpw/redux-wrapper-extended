import {ReducerWrapper, StoreWrapper} from '../src/redux-wrapper-extended.js';


const countReducerWrapper = new ReducerWrapper(0)
  .addHandler("INCREMENT",(state,payload)=>{
    return state + payload;
  })
  .addHandler("DECREMENT",(s,p)=>{
    return s - p;
  })
  .addPropChangedHandler("SET_VALUE");

const storeWrapper = new StoreWrapper({
    count: countReducerWrapper.getReducer(),
  },
  {
    count:0,
  });




var store = storeWrapper.getStore();
store.subscribe(() => {
  console.log("Store changed", store.getState());
});

// set count to 10
store.dispatch({type: "SET_VALUE", payload: 10});
// add 3 to current state
store.dispatch({type: "INCREMENT", payload: 3});
// subtract 2 from current state
store.dispatch({type: "DECREMENT", payload: 2});

// you can also do something like this
// set count to 10
storeWrapper.dispatch("SET_VALUE",10);
// add 3 to current state
storeWrapper.dispatch("INCREMENT",3);
// subtract 2 from current state
storeWrapper.dispatch("DECREMENT",2);
