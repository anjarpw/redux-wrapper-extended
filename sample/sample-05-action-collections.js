import {ReducerWrapper, StoreWrapper, ActionCollections} from '../src/redux-wrapper-extended.js';


const countReducerWrapper = new ReducerWrapper(0)
  .addHandler("calc.INCREMENT",(state,payload)=>{
    return state + payload;
  })
  .addHandler("calc.DECREMENT",(s,p)=>{
    return s - p;
  })
  .addPropChangedHandler("calc.SET_VALUE");

var reducers = ReducerWrapper.combine({
    count: countReducerWrapper.getReducer(),
  });

var state = {
  count:0
};


const storeWrapper = new StoreWrapper(reducers,state);




var store = storeWrapper.getStore();
store.subscribe(() => {
  console.log("Store changed", store.getState());
});

const actionCollections = new ActionCollections("calc",{
  INCREMENT:(valueToIncrease)=> valueToIncrease,
  DECREMENT:(valueToDecrease)=> valueToDecrease,
  SET_VALUE:(valueToSet)=> valueToSet
})
console.log("ACTION INCREMENT 20");
var result1 = actionCollections.generator.INCREMENT(20);
console.log(result1);
console.log("ACTION INCREMENT 30");
var result2 = actionCollections.generator.DECREMENT(30);
console.log(result2);
console.log("ACTION SET_VALUE 100");
var result3 = actionCollections.generator.SET_VALUE(100);
console.log(result3);

console.log("SET_VALUE TO 10");
store.dispatch(actionCollections.generator.SET_VALUE(10));
// add 3 to current state
console.log("INCREMENT 3");
store.dispatch(actionCollections.generator.INCREMENT(3));
// subtract 2 from current state
console.log("DECREMENT 2");
store.dispatch(actionCollections.generator.DECREMENT(2));

var executor = actionCollections.setExecutor(store.dispatch);

console.log("SET_VALUE TO 10");
executor.SET_VALUE(10);
// add 3 to current state
console.log("INCREMENT 3");
executor.INCREMENT(3);
// subtract 2 from current state
console.log("DECREMENT 2");
executor.DECREMENT(2);

