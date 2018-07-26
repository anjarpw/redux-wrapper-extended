import { ReducerWrapper, StoreWrapper, combineReducerWrapper } from '../src';
import { Reducer } from 'redux';


export default function(){

  const countReducerWrapper = new ReducerWrapper<number>(0)
    .addHandler("INCREMENT",(state: number,payload: number)=>{
      return state + payload;
    })
    .addHandler("DECREMENT",(state: number,payload: number)=>{
      return state - payload;
    })
    .addPropChangedHandler("SET_VALUE");

  var reducer : Reducer<any> = combineReducerWrapper({
      count: countReducerWrapper.getReducer(),
    });

  var state = {
    count:0
  }

  const storeWrapper = new StoreWrapper(reducer,state);

  var store = storeWrapper.getStore();
  store.subscribe(() => {
    console.log("Store changed", store.getState());
    console.log("")
  });

  // set count to 10
  console.log("SET_VALUE TO 10");
  store.dispatch({type: "SET_VALUE", payload: 10});
  // add 3 to current state
  console.log("INCREMENT 3");
  store.dispatch({type: "INCREMENT", payload: 3});
  // subtract 2 from current state
  console.log("DECREMENT 2");
  store.dispatch({type: "DECREMENT", payload: 2});

  // you can also do something like this
  // set count to 10
  console.log("SET_VALUE TO 10");
  storeWrapper.dispatch("SET_VALUE",10);
  // add 3 to current state
  console.log("INCREMENT 3");
  storeWrapper.dispatch("INCREMENT",3);
  // subtract 2 from current state
  console.log("DECREMENT 2");
  storeWrapper.dispatch("DECREMENT",2);
  
}
