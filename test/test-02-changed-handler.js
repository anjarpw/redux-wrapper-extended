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


const storeWrapper = new StoreWrapper({
    detail: detailReducerWrapper.getReducer(),
  },
  {
    detail:{
      name:"Anjar",
      age:27,
      contacts:{
        email:"anjar.p.wicaksono@gmail.com",
        phone:"81807978"
      }
    }
  });

var store = storeWrapper.getStore();
store.subscribe(() => {
  console.log("Store changed", store.getState());
});


store.dispatch({type: "SET_NAME", payload: "John"});
store.dispatch({type: "SET_AGE", payload: 16});
store.dispatch({type: "SET_AGE", payload: 23});
store.dispatch({type: "SET_PHONE", payload: "91908988"});
