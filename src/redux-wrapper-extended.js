import {createStore, combineReducers} from 'redux';

function StoreWrapper (reducers, initialState){
  if(typeof reducers === 'object'){
    reducers = combineReducerWrapper(reducers);
  }

  return {
    combinedReducers: reducers,
    store: createStore(reducers, initialState),
    dispatch: function (type, payload) {
      return this.store.dispatch({type: type, payload: payload});
    },
    getStore: function () {
      return this.store;
    },
    getCombinedReducers: function () {
      return this.combinedReducers;
    }
  }
}

function uselessReducer(state, action){
  if(state==undefined){
    return null;
  }
  return state;
}
function combineReducerWrapper(reducers){
  var items = {};
  for(var prop in reducers){
    var reducer = reducers[prop];
    if(typeof reducer === 'function'){
      items[prop] = reducer;
    }else if(typeof reducer == 'object'){
      items[prop] = combineReducerWrapper(reducer);
    }
  }
  return combineReducers(items);
}

function ReducerWrapper (defaultState) {
  defaultState = defaultState || null;
  return {
    defaultState : defaultState,
    funcs : {},
    withHandlersFromOtherReducerWrappers: function (reducerWrappers){
      var _this = this;
      reducerWrappers.forEach( function (reducer) {
        Object.keys(reducer.funcs).forEach( function (key) {
          _this.funcs[key] = reducer.funcs[key];
        });
      });
      return this;
    },

    addHandler: function (type, handler){
      var func = function (state,action) {
        if(action.type === type){
          return handler(state,action.payload);
        }
        return state;
      }
      this.funcs[type] = func;
      return this;
    },

    getNavigationProps: function (func) {
          var strElement = func.toString().split("=>");
          var arrayProps = "";
          if (strElement.length==2) {
            arrayProps = strElement[1]
          } else if(strElement.length==1) {
            var regex = /return((.|\n)*(?=\;))/g;
            var matches = strElement[0].match(regex);
            arrayProps = matches[0].replace('return');
          }
          return arrayProps.trim().split(".");
    },

    lambdaFuncToInitialPropInfo: function (func){
      var navigations = this.getNavigationProps(func);
      var navToLast = ["x"].concat(navigations.slice(1,navigations.length-1)).join(".");
      return {
        rootProp:navigations[1],
        lastProp:navigations[navigations.length-1],
        beforeLastFunc:eval("(x) => "+navToLast),
        navigations: navigations
      };
    },

    addPropChangedHandler: function (type, contextMapping, payloadFunc){
      payloadFunc = payloadFunc || function (s,pl) { return pl }
      var propInfo = null;
      if(contextMapping){
        propInfo = this.lambdaFuncToInitialPropInfo(contextMapping);
      }


      var func = function (state,action) {
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
    },

    getReducer: function (otherReducer){

      var combinedReducerDefault = null;
      if(otherReducer){
        combinedReducerDefault = combineReducerWrapper(otherReducer);
      }
      var _this = this;
      return function (state, action) {
        state = state || defaultState;
        var initialState = state;
        var newState = state;
        for(var funcType in _this.funcs){
          var func = _this.funcs[funcType];
          newState = func(state, action);
          if(newState!=state){
            break;
          }
        }
        if(otherReducer){
          newState = newState || {};
          var deeperNewerState = combinedReducerDefault(newState, action);
          return Object.assign({}, newState, deeperNewerState);
        }
        return newState;
      }
    }
  }
}

function ActionCollections (name, actions) {
  var generator = {};
  Object.keys(actions).forEach( function (key) {
    var callableAction = actions[key];
    generator[key] = function() {
      return {
        type: name + "."+key,
        payload: callableAction.apply(null,arguments)
      }
    }
  });
  return {
    name: name,
    generator: generator,
    setExecutor: function (dispatch){
      var executor = {};
      var _this = this;
      Object.keys(this.generator).forEach( function (key) {
        var callableAction = _this.generator[key];
        executor[key] = function() {
          var generatedAction = callableAction.apply(null,arguments);
          dispatch(generatedAction);
        }
      });
      return executor;
    }
  }
}

var dispatchAction = function (dispatchFunc, type, payload) {
  return dispatchFunc({type:type, payload:payload});
}

export {
  uselessReducer as uselessReducer,
  combineReducerWrapper as combineReducerWrapper,
  StoreWrapper as StoreWrapper,
  ActionCollections as ActionCollections,
  ReducerWrapper as ReducerWrapper,
  dispatchAction as dispatchAction
}
