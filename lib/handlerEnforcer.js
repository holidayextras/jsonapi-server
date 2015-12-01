"use strict";
var handlerEnforcer = module.exports = { };

var debug = require("./debugging.js");

handlerEnforcer.wrap = function(handlers) {
  handlers.search = handlerEnforcer._search(handlers);
  handlers.find = handlerEnforcer._find(handlers);
  handlers.create = handlerEnforcer._create(handlers);
  handlers.update = handlerEnforcer._update(handlers);
  handlers.delete = handlerEnforcer._delete(handlers);
};

handlerEnforcer._strictReplace = function(handlers, operation, outCount) {
  var original = handlers[operation];
  return function() {
    var argsIn = Array.prototype.slice.call(arguments);
    var requestParams = argsIn[0].params;
    var callback = argsIn.pop();
    argsIn.push(function() {
      var argsOut = Array.prototype.slice.call(arguments);
      argsOut = argsOut.slice(0, outCount);
      debug.handler[operation](JSON.stringify(requestParams), JSON.stringify(argsOut));
      return callback.apply(null, argsOut);
    });
    original.apply(handlers, argsIn);
  };
};

handlerEnforcer._search = function(handlers) {
  return handlerEnforcer._strictReplace(handlers, "search", 2);
};

handlerEnforcer._find = function(handlers) {
  return handlerEnforcer._strictReplace(handlers, "find", 2);
};

handlerEnforcer._create = function(handlers) {
  return handlerEnforcer._strictReplace(handlers, "create", 2);
};

handlerEnforcer._update = function(handlers) {
  return handlerEnforcer._strictReplace(handlers, "update", 2);
};

handlerEnforcer._delete = function(handlers) {
  return handlerEnforcer._strictReplace(handlers, "delete", 1);
};
