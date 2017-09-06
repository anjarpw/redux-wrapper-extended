# redux-wrapper-extended

This package gives you shortcut for redux.

#### Assumption

  - Action has property **_type_**
  - Action has property **_payload_**
  - other than those two will be ignored

you have action object that looks like:
```sh
var action = {
    type:"Something",
    payload //either object or value
}
```

#### Is it simplifying? YES and NO

Given you have this reducer

```sh
const countReducer = (state,action)=>{
    if(action.type === "INCREMENT"){
        return state + action.payload;
    }
    if(action.type === "INCREMENT"){
        return state + action.payload;
    }
    if(action.type === "SETVAL"){
        return action.payload;
    }
    return state;
}
```

By using **reducer-wrapper-extended**, you could make something like this:
```sh
const countReducerWrapper =
new ReducerWrapper(0)
    .addHandler("INC",(s,pl)=>{
        return s + pl;
    })
    .addHandler("DEC",(s,pl)=>{
        return s - pl;
    })
    .addPropChangedHandler("SETVAL");
```

and you can use it like this:
```sh
const countReducer = countReducerWrapper.getReducer();
```

```sh
const storeWrapper = new StoreWrapper(
    { //combining reducers
        count: countReducerWrapper.getReducer(),
        detail: //some other reducer
    },
    { //initial properties, nothing fancy
        count:0,
        detail: {
        // a complex object
        }
    });
```

Don't worry, it's just a wrapper. you can get the actual redux store
```sh
var store = storeWrapper.getStore();

store.subscribe(() => {
    console.log("Store changed", store.getState());
});
```

#### Getting Fancier
```sh
const detailReducerWrapper =
new ReducerWrapper()

    .addPropChangedHandler("SET_NAME",(x)=>x.name)

    .addPropChangedHandler("SET_AGE",(x)=>x.age, (state,payload) => {
        if(payload<18){
          return 18;
        }
        return payload;
    })

    .addPropChangedHandler("SET_PHONE",(x)=>x.contacts.phone);

```

then you create a store

```sh
const storeWrapper = new StoreWrapper(
    {
        count: countReducerWrapper.getReducer(),
        detail: detailReducerWrapper.getReducer(),
    },
    {
        count:0,
        detail:{
            name:"Anjar",
            age:27,
            contacts:{
                email:"anjar.p.wicaksono@gmail.com",
                phone:"81807978"
            }
        }
    });
```

#### Combining Cascading Reducers

>Please take note that the idea the state should be as flattened as possible.
>But if you are still willing to have some level of hierarchies, here are the samples

if **detailReducerWrapper** does not change the state of an action,
then now **nameReducerWrapper** will try to be invoked

Take note that the context of _nameReducerWrapper's state_ is -> detail -> name

```sh
const nameReducerWrapper = new ReducerWrapper("Jon Doe") // default value
    .addHandler("CHANGE_NAME",(state,payload)=>{
        if(!hasFunnyCharacter()){
            return payload;
        }
        return state;
    })
```

```sh
const storeWrapper = new StoreWrapper(
    {
        detail:detailReducerWrapper.getReducer({
            // override
            name:nameReducerWrapper.getReducer(),

            // maintain existence of 'age'
            age:ReducerWrapper.uselessReducer
        }),
    },
    {
        detail:{
            name:"Anjar",
            age:27
        }
    });
```


You can also do something like this

```sh
const storeWrapper = new StoreWrapper(
    {
        detail:{
            name:nameReducerWrapper.getReducer(),

            // maintain existence of 'age'
            age:ReducerWrapper.uselessReducer,

            contacts:{

                // override contact in, state is relative to its context
                email:emailReducerWrapper.getReducer(),

                // maintain existence of 'phone'
                phone:ReducerWrapper.uselessReducer,
            }
        },
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
```

#### Others
```sh
var store = storeWrapper.getStore();
store.dispatch({type: "SET_VALUE", payload: 10});
```
equal with
```sh
storeWrapper.dispatch("SET_VALUE",10);
```

this is a function pointer. the function itself checks
  - if state is undefined, then return null
  - else, return original state

```sh
ReducerWrapper.uselessReducer
```

#### StoreWrapper
| Function | Purpose  |
| ------------- |:-------------:|
| **dispatch(type, payload)**      | will call the store.dispatch with action with the same type and payload|
| **getStore()** | return original redux store |
| **getCombinedReducers()** | return combined reducers of the wrapped store |

#### ReducerWrapper
| Function | Purpose  |
| ------------- |:-------------:|
| **addHandler(type, handler)**      | the type is type of the action, the handler must have signature **function(state, payloadOfAction)** and return new **state**  |
| **addPropChangedHandler(type, navigationProperty, handler)** | similar to **addHandler(type, handler)** but it has navigation property and the state is the context of that navigation property |
| **getReducer()** | compose the reducer |
| **static uselessReducer** | see sample above |
