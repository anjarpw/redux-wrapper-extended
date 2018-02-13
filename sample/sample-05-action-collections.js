import {ActionCollections} from '../src/redux-wrapper-extended.js';

var actionCollections = new ActionCollections("message", {
  sendGreet: (firstName, lastName) => "Hello " + firstName + " " + lastName,
  callPerson: (phone) => {
    return {
      phone:phone
    }
  }
})

var result1 = actionCollections.actions.sendGreet("Paul","McCartney");
console.log(result1);
var result2 = actionCollections.actions.callPerson("082132134321");
console.log(result2);