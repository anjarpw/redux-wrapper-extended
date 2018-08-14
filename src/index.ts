import {createStore, combineReducers, Reducer, AnyAction, Store, ReducersMapObject, StoreEnhancer, Dispatch} from 'redux';


export interface ExtendedReducersMapObject {
  [key: string]: Reducer<any> | ExtendedReducersMapObject
}

export interface ReducerDict<S> {
  [key: string]: Reducer<S>  
}

export type Handler<S>  = (state: S, payload: any) => S

export interface PropInfo{
  rootProp:string,
  lastProp:string,
  beforeLastFunc: <S>(input:S) => any,
  navigations: string[]
}

export interface ActionGeneratorDict {
  [key: string]: (...args:any[]) => AnyAction 
}

export interface AnyActionDictionary{
  [key: string]: (...args:any[]) => any   
}

export interface AnyProps {
  // Allows any extra properties to be defined in an action.
  [extraProps: string]: any;
}


class StoreWrapper<S>{

  store: Store<S>
  combinedReducers: Reducer<S>

  constructor(reducers : ExtendedReducersMapObject | Reducer<S>, initialState: S | null, enhancer?: StoreEnhancer<S>){
    let reducerAsExtendedMapObject = reducers as ExtendedReducersMapObject
    let reducerAsReducer = reducers as Reducer<S>
    if(typeof reducers === 'object'){      
      this.combinedReducers = combineReducerWrapper(reducerAsExtendedMapObject)
    }else{
      this.combinedReducers = reducerAsReducer
    }
    if(initialState){
      this.store = createStore(this.combinedReducers, initialState, enhancer)  
    }else {
      this.store = createStore(this.combinedReducers, enhancer)  
    }
  }

  dispatch(type: string, payload: any) {
    return this.store.dispatch({type: type, payload: payload});
  }
  getStore() {
    return this.store;
  }
  getCombinedReducers() {
    return this.combinedReducers;
  }
}

let uselessReducer = <S> (state: S, action: AnyAction) : S | null => {
  if(state==undefined){
    return null;
  }
  return state;
}
let combineReducerWrapper = <S> (reducers: ExtendedReducersMapObject) : Reducer<S> => {
  let items: ReducersMapObject = {};
  for(var prop in reducers){
    var reducer = reducers[prop];
    let reducerAsMapObject = reducer as ExtendedReducersMapObject
    let reducerAsReducer = reducer as Reducer<S>
    if(typeof reducer === 'object'){
      items[prop] = combineReducerWrapper(reducerAsMapObject);
    }else if(typeof reducer === 'function'){
      items[prop] = reducerAsReducer
    } 
  }
  return combineReducers(items);
}


class ReducerWrapper<S> {
  defaultState : S | null
  funcs: ReducerDict<any>

  constructor(defaultState?: S){
    this.defaultState = defaultState || null;
    this.funcs = {}
  }
  withHandlersFromOtherReducerWrappers (reducerWrappers: ReducerWrapper<any>[]){
    let t  = this
    reducerWrappers.forEach((reducer: ReducerWrapper<any>) => {
      Object.keys(reducer.funcs).forEach( function (key) {
        t.funcs[key] = reducer.funcs[key];
      });
    });
    return this;
  }

  addHandler (type: string, handler: Handler<S>){
    var func = function (state: S, action: AnyAction) {
      if(action.type === type){
        return handler(state,action.payload)
      }
      return state
    }
    this.funcs[type] = func
    return this
  }

  getNavigationProps (func: Handler<S>): string[] {
    var strElement = func.toString().split("=>")
    var arrayProps = ""
    if (strElement.length==2) {
      arrayProps = strElement[1]
    } else if(strElement.length==1) {
      var regex = /return((.|\n)*(?=\;))/g
      var matches = strElement[0].match(regex)
      if(matches){
        arrayProps = matches[0].replace('return','')
      }
    }
    return arrayProps.trim().split(".")
  }

  lambdaFuncToInitialPropInfo (func: Handler<S>): PropInfo{
    var navigations = this.getNavigationProps(func);
    var navToLast = ["x"].concat(navigations.slice(1,navigations.length-1)).join(".");
    return {
      rootProp:navigations[1],
      lastProp:navigations[navigations.length-1],
      beforeLastFunc:eval("(x) => "+navToLast),
      navigations: navigations
    };
  }

  addPropChangedHandler (type: string, mappingFunc?: ((state: S, payload: any) => any), payloadFunc?: Handler<S>){
    let defaultPayloadFunc = (s : S, pl: any)  => pl
    let usedPayloadFunc = payloadFunc || defaultPayloadFunc
    var propInfo : PropInfo | null = null;
    if(mappingFunc){
      propInfo = this.lambdaFuncToInitialPropInfo(mappingFunc);
    }


    var func = function (state: S, action: AnyAction) {
      if(action.type === type){
        if(typeof state === 'object' && propInfo && propInfo.rootProp){
          let stateAsObject = state as AnyProps
          var childOfDuplicatedObject =  JSON.parse(JSON.stringify(stateAsObject[propInfo.rootProp]));
          var newState : S = Object.assign({},state);
          let newStateAsObject = newState as AnyProps
          newStateAsObject[propInfo.rootProp] = childOfDuplicatedObject;          
          var focusedObject: AnyProps = propInfo.beforeLastFunc<S>(newState)
          focusedObject[propInfo.lastProp] = usedPayloadFunc(state, action.payload);
          return newState
        }else{
          return usedPayloadFunc(state, action.payload);
        }
      }
      return state;
    }

    this.funcs[type] = func;
    return this;
  }

  getReducer (otherReducers?: ExtendedReducersMapObject){

    let combinedReducerDefault : Reducer<S> | null = null;
    if(otherReducers){
      combinedReducerDefault = combineReducerWrapper(otherReducers);
    }
    var t = this;
    return (state : S, action: AnyAction) => {
      state = state || this.defaultState;
      var newState = state;
      for(var funcType in t.funcs){
        var func = t.funcs[funcType];
        newState = func(state, action);
        if(newState!=state){
          break;
        }
      }
      if(combinedReducerDefault){
        newState = newState || {};
        var deeperNewerState = combinedReducerDefault(newState, action);
        return Object.assign({}, newState, deeperNewerState);
      }
      return newState;
    }
  }
  

  static importFrom<S>(anotherReducer: Reducer<S>, initialState: S) {
    var reducerWrappers = new ReducerWrapper(initialState)
    reducerWrappers.funcs['_importedFrom'] = anotherReducer
    return reducerWrappers
  }
}

class ActionCollections {

  generator : ActionGeneratorDict

  name: string



  constructor (name: string, actions: AnyActionDictionary) {
    var generator : ActionGeneratorDict = {}
    Object.keys(actions).forEach( function (key) {
      var callableAction: (...args:any[]) => any = actions[key]
      generator[key] = function() {
        return {
          type: name + "."+key,
          payload: callableAction.apply(null,arguments)
        }
      }
    })    
    this.name = name
    this.generator = generator
  }
  setExecutor (dispatch: Dispatch<AnyAction>) : AnyActionDictionary{
    var executor :AnyActionDictionary = {};
    var t = this
    Object.keys(this.generator).forEach( function (key) {
      var callableAction : (...args:any[]) => any = t.generator[key]
      executor[key] = function() {
        var generatedAction = callableAction.apply(null,arguments)
        dispatch(generatedAction)
      }
    })
    return executor
  }
}

let dispatchAction = <S>(dispatchFunc: Dispatch<AnyAction>, type: string, payload?: any) : AnyAction => {
  let anyAction : AnyAction = {
    type,
    payload
  }
  return dispatchFunc(anyAction);
}



export {
  uselessReducer as uselessReducer,
  combineReducerWrapper as combineReducerWrapper,
  StoreWrapper as StoreWrapper,
  ActionCollections as ActionCollections,
  ReducerWrapper as ReducerWrapper,
  dispatchAction as dispatchAction
}
