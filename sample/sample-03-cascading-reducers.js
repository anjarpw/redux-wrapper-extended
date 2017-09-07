import {ReducerWrapper, StoreWrapper} from '../src/redux-wrapper-extended.js';


const detailReducerWrapper = new ReducerWrapper()
  .addPropChangedHandler("SET_NAME",(x)=>x.name)
  .addPropChangedHandler("SET_AGE",(x)=>x.age, (state,payload) => {
    if(payload<18){
      return 18;
    }
    return payload;
  });

const emailReducerWrapper = new ReducerWrapper().addPropChangedHandler("SET_EMAIL");
const nameReducerWrapper = new ReducerWrapper().addPropChangedHandler("SET_NAME_ALSO");


var reducers = ReducerWrapper.combine({
    // a reducer could have its "child" reducers, they are in action if the state is not changed by the 'parent' reducer
    detail:detailReducerWrapper.getReducer({
      // override
      name:nameReducerWrapper.getReducer(),

      // maintain existence of 'age'
      age:ReducerWrapper.uselessReducer,
      contacts:{

        // override contact in, state is relative to its context
        email:emailReducerWrapper.getReducer(),

        // maintain existence of 'phone'
        phone:ReducerWrapper.uselessReducer,
      }
    }),
  });

var state =   {
  detail:{
    name:"Anjar",
    age:27,
    contacts:{
      email:"anjar.p.wicaksono@gmail.com",
      phone:"81807978"
    }
  }
};

// HERE IS CASCADING IN ACTION
const storeWrapper = new StoreWrapper(reducers,state);

var store = storeWrapper.getStore();
store.subscribe(() => {
  console.log("Store changed", store.getState());
});


console.log("SET_NAME TO John");
store.dispatch({type: "SET_NAME", payload: "John"});
console.log("SET_AGE TO 16");
store.dispatch({type: "SET_AGE", payload: 16});
console.log("SET_AGE TO 23");
store.dispatch({type: "SET_AGE", payload: 23});
console.log("SET_NAME_ALSO TO Paul");
store.dispatch({type: "SET_NAME_ALSO", payload: "Paul"});
console.log("SET_EMAIL TO john2000@gmail.com");
store.dispatch({type: "SET_EMAIL", payload: "SET_EMAILjohn2000@gmail.com"});
