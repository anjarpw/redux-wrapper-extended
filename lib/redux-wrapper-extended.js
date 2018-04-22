'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dispatchAction = exports.ReducerWrapper = exports.ActionCollections = exports.StoreWrapper = exports.combineReducerWrapper = exports.uselessReducer = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _redux = require('redux');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StoreWrapper = function () {
  function StoreWrapper(reducers, initialState) {
    _classCallCheck(this, StoreWrapper);

    if ((typeof reducers === 'undefined' ? 'undefined' : _typeof(reducers)) === 'object') {
      reducers = combineReducerWrapper(reducers);
    }
    this.combinedReducers = reducers;
    this.store = (0, _redux.createStore)(reducers, initialState);
  }

  _createClass(StoreWrapper, [{
    key: 'dispatch',
    value: function dispatch(type, payload) {
      return this.store.dispatch({ type: type, payload: payload });
    }
  }, {
    key: 'getStore',
    value: function getStore() {
      return this.store;
    }
  }, {
    key: 'getCombinedReducers',
    value: function getCombinedReducers() {
      return this.combinedReducers;
    }
  }]);

  return StoreWrapper;
}();

var uselessReducer = function uselessReducer(state, action) {
  if (state == undefined) {
    return null;
  }
  return state;
};
var combineReducerWrapper = function combineReducerWrapper(reducers) {
  var items = {};
  for (var prop in reducers) {
    var reducer = reducers[prop];
    if (typeof reducer === 'function') {
      items[prop] = reducer;
    } else if ((typeof reducer === 'undefined' ? 'undefined' : _typeof(reducer)) == 'object') {
      items[prop] = combineReducerWrapper(reducer);
    }
  }
  return (0, _redux.combineReducers)(items);
};

var ReducerWrapper = function () {
  function ReducerWrapper(defaultState) {
    _classCallCheck(this, ReducerWrapper);

    this.defaultState = defaultState || null;
    this.funcs = {};
  }

  _createClass(ReducerWrapper, [{
    key: 'withHandlersFromOtherReducerWrappers',
    value: function withHandlersFromOtherReducerWrappers(reducerWrappers) {
      var _this = this;
      reducerWrappers.forEach(function (reducer) {
        Object.keys(reducer.funcs).forEach(function (key) {
          _this.funcs[key] = reducer.funcs[key];
        });
      });
      return this;
    }
  }, {
    key: 'addHandler',
    value: function addHandler(type, handler) {
      var func = function func(state, action) {
        if (action.type === type) {
          return handler(state, action.payload);
        }
        return state;
      };
      this.funcs[type] = func;
      return this;
    }
  }, {
    key: 'getNavigationProps',
    value: function getNavigationProps(func) {
      var strElement = func.toString().split("=>");
      var arrayProps = "";
      if (strElement.length == 2) {
        arrayProps = strElement[1];
      } else if (strElement.length == 1) {
        var regex = /return((.|\n)*(?=\;))/g;
        var matches = strElement[0].match(regex);
        arrayProps = matches[0].replace('return');
      }
      return arrayProps.trim().split(".");
    }
  }, {
    key: 'lambdaFuncToInitialPropInfo',
    value: function lambdaFuncToInitialPropInfo(func) {
      var navigations = this.getNavigationProps(func);
      var navToLast = ["x"].concat(navigations.slice(1, navigations.length - 1)).join(".");
      return {
        rootProp: navigations[1],
        lastProp: navigations[navigations.length - 1],
        beforeLastFunc: eval("(x) => " + navToLast),
        navigations: navigations
      };
    }
  }, {
    key: 'addPropChangedHandler',
    value: function addPropChangedHandler(type, contextMapping, payloadFunc) {
      payloadFunc = payloadFunc || function (s, pl) {
        return pl;
      };
      var propInfo = null;
      if (contextMapping) {
        propInfo = this.lambdaFuncToInitialPropInfo(contextMapping);
      }

      var func = function func(state, action) {
        if (action.type === type) {

          if ((typeof state === 'undefined' ? 'undefined' : _typeof(state)) === 'object' && propInfo && propInfo.rootProp) {

            var childOfDuplicatedObject = JSON.parse(JSON.stringify(state[propInfo.rootProp]));
            var newState = Object.assign({}, state);
            newState[propInfo.rootProp] = childOfDuplicatedObject;
            propInfo.beforeLastFunc(newState)[propInfo.lastProp] = payloadFunc(state, action.payload);
            return newState;
          } else {
            return payloadFunc(state, action.payload);
          }
        }
        return state;
      };

      this.funcs[type] = func;
      return this;
    }
  }, {
    key: 'getReducer',
    value: function getReducer(otherReducer) {
      var _this2 = this;

      var combinedReducerDefault = null;
      if (otherReducer) {
        combinedReducerDefault = combineReducerWrapper(otherReducer);
      }
      var _this = this;
      return function (state, action) {
        state = state || _this2.defaultState;
        var initialState = state;
        var newState = state;
        for (var funcType in _this.funcs) {
          var func = _this.funcs[funcType];
          newState = func(state, action);
          if (newState != state) {
            break;
          }
        }
        if (otherReducer) {
          newState = newState || {};
          var deeperNewerState = combinedReducerDefault(newState, action);
          return Object.assign({}, newState, deeperNewerState);
        }
        return newState;
      };
    }
  }]);

  return ReducerWrapper;
}();

var ActionCollections = function () {
  function ActionCollections(name, actions) {
    _classCallCheck(this, ActionCollections);

    var generator = {};
    Object.keys(actions).forEach(function (key) {
      var callableAction = actions[key];
      generator[key] = function () {
        return {
          type: name + "." + key,
          payload: callableAction.apply(null, arguments)
        };
      };
    });
    this.name = name;
    this.generator = generator;
  }

  _createClass(ActionCollections, [{
    key: 'setExecutor',
    value: function setExecutor(dispatch) {
      var executor = {};
      var _this = this;
      Object.keys(this.generator).forEach(function (key) {
        var callableAction = _this.generator[key];
        executor[key] = function () {
          var generatedAction = callableAction.apply(null, arguments);
          dispatch(generatedAction);
        };
      });
      return executor;
    }
  }]);

  return ActionCollections;
}();

var dispatchAction = function dispatchAction(dispatchFunc, type, payload) {
  return dispatchFunc({ type: type, payload: payload });
};

exports.uselessReducer = uselessReducer;
exports.combineReducerWrapper = combineReducerWrapper;
exports.StoreWrapper = StoreWrapper;
exports.ActionCollections = ActionCollections;
exports.ReducerWrapper = ReducerWrapper;
exports.dispatchAction = dispatchAction;