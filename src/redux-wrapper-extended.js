import {createStore, combineReducers} from 'redux';

class StoreWrapper{
  constructor(reducers, initialState){
    if(typeof reducers === 'object'){
      reducers = ReducerWrapper.combine(reducers);
    }

    this.combinedReducers = reducers;
    this.store = createStore(this.combinedReducers, initialState);
  }
  dispatch(type, payload){
    return this.store.dispatch({type: type, payload: payload});
  }
  getStore(){
    return this.store;
  }
  getCombinedReducers(){
    return this.combinedReducers;
  }
}
class ReducerWrapper {
  constructor(defaultState=null){
    this.defaultState = defaultState;
    this.funcs = {};
    return this;
  }

  withHandlersFromOtherReducerWrappers(reducerWrappers){
    reducerWrappers.forEach(reducer=>{
      Object.keys(reducer.funcs).forEach(key=>{
        this.funcs[key] = reducer.funcs[key];          
      });
    });
    return this;
  }

  addHandler(type, handler){
    var func = (state,action) => {
      if(action.type === type){
        return handler(state,action.payload);
      }
      return state;
    }
    this.funcs[type] = func;
    return this;
  }


  getNavigationProps(func){
        var strElement = func.toString().split("=>");
        var arrayProps = "";
        if(strElement.length==2){
          arrayProps = strElement[1]
        }else if(strElement.length==1){
          const regex = /return((.|\n)*(?=\;))/g;
          var matches = strElement[0].match(regex);
          arrayProps = matches[0].replace('return');
        }
        return arrayProps.trim().split(".");
  }

  lambdaFuncToInitialPropInfo(func){
    var navigations = this.getNavigationProps(func);
    var navToLast = ["x"].concat(navigations.slice(1,navigations.length-1)).join(".");
    return {
      rootProp:navigations[1],
      lastProp:navigations[navigations.length-1],
      beforeLastFunc:eval("(x) => "+navToLast),
      navigations
    }
  }

  addPropChangedHandler(type, contextMapping,payloadFunc = (s,pl)=>pl){
    var propInfo = null;
    if(contextMapping){
      propInfo = this.lambdaFuncToInitialPropInfo(contextMapping);
    }


    var func = (state,action) => {
      if(action.type === type){

        if(typeof state === 'object' && propInfo && propInfo.rootProp){

          var childOfDuplicatedObject =  JSON.parse(JSON.stringify(state[propInfo.rootProp]));
          var newState = Object.assign({},state);
          newState[propInfo.rootProp] = childOfDuplicatedObject;
          propInfo.beforeLastFunc(newState)[propInfo.lastProp] = payloadFunc(state, action.payload);
          return newState;
        }else{
          return payloadFunc(state, action.payload);
        }
      }
      return state;
    }

    this.funcs[type] = func;
    return this;
  }

  getReducer(otherReducer){

    var combinedReducerDefault = null;
    if(otherReducer){
      combinedReducerDefault = ReducerWrapper.combine(otherReducer);
    }
    return (state=this.defaultState, action)=>{
      var initialState = state;
      var newState = state;
      for(var funcType in this.funcs){
        var func = this.funcs[funcType];
        newState = func(state, action);
        if(newState!=state){
          break;
        }
      }
      if(state != null && otherReducer){
        return combinedReducerDefault(state, action);
      }
      return newState;
    }
  }
  static combine(reducers){
    var items = {};
    for(var prop in reducers){
      var reducer = reducers[prop];
      if(typeof reducer === 'function'){
        items[prop] = reducer;
      }else if(typeof reducer == 'object'){
        items[prop] = ReducerWrapper.combine(reducer);
      }
    }
    return combineReducers(items);
  }

  static uselessReducer(state, action){
    if(state==undefined){
      return null;
    }
    return state;
  }
}

class ActionCollections{
  constructor(name, actions){
    this.name = name;
    this.generator = {};
    Object.keys(actions).forEach(key=>{
      let callableAction = actions[key];
      this.generator[key] = function() {
        return {
          type: name + "."+key,
          payload: callableAction.apply(null,arguments)
        }
      }
    });
  }
  setExecutor(dispatch){
    var executor = {};
    Object.keys(this.generator).forEach(key=>{
      let callableAction = this.generator[key];
      executor[key] = function() {
        let generatedAction = callableAction.apply(null,arguments);
        dispatch(generatedAction);
      }
    });
    return executor;
  }
} 

const dispatchAction = (dispatchFunc, type, payload) => {
  return dispatchFunc({type:type, payload:payload});
}

export {
  StoreWrapper as StoreWrapper,
  ActionCollections as ActionCollections, 
  ReducerWrapper as ReducerWrapper,
  dispatchAction as dispatchAction
}
