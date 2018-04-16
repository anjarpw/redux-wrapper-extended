import {ReducerWrapper, StoreWrapper} from '../src/redux-wrapper-extended.js';


const detailReducerWrapper = new ReducerWrapper()
  .addPropChangedHandler("SET_NAME",(x)=>x.name)
  // HERE IS relative path using context of 'detail' and plus some logic
  .addPropChangedHandler("SET_AGE",(x)=>x.age, (state,payload) => {
    if(payload<18){
      return 18;
    }
    return payload;
  })
  // HERE IS relative path using context of 'detail'
  .addPropChangedHandler("SET_PHONE",(x)=>x.contacts.phone);

var reducers = {
  detail: detailReducerWrapper.getReducer()
};

var state = {
  detail:{
    name:"Anjar",
    age:27,
    contacts:{
      email:"anjar.p.wicaksono@gmail.com",
      phone:"81807978"
    }
  }
};

const storeWrapper = new StoreWrapper(reducers, state);

var store = storeWrapper.getStore();
store.subscribe(() => {
  console.log("Store changed", store.getState());
});

console.log("SET_NAME TO John");
store.dispatch({type: "SET_NAME", payload: "John"});
console.log("SET_AGE TO 16, but set at 18");
store.dispatch({type: "SET_AGE", payload: 16});
console.log("SET_AGE TO 23");
store.dispatch({type: "SET_AGE", payload: 23});
console.log("SET_PHONE TO 91908988");
store.dispatch({type: "SET_PHONE", payload: "91908988"});
