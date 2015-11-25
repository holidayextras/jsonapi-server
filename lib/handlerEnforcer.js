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

handlerEnforcer._search = function(handlers) {
  var original = handlers.search;
  return function(request, callback) {
    original.call(handlers, request, function(err, resources) {
      debug.handler.search(JSON.stringify(request.params), JSON.stringify(err), JSON.stringify(resources));
      return callback(err, resources);
    });
  };
};

handlerEnforcer._find = function(handlers) {
  var original = handlers.find;
  return function(request, callback) {
    original.call(handlers, request, function(err, resource) {
      debug.handler.find(JSON.stringify(request.params), JSON.stringify(err), JSON.stringify(resource));
      return callback(err, resource);
    });
  };
};

handlerEnforcer._create = function(handlers) {
  var original = handlers.create;
  return function(request, newResource, callback) {
    original.call(handlers, request, newResource, function(err, handledResource) {
      debug.handler.create(JSON.stringify(request.params), JSON.stringify(newResource), JSON.stringify(err), JSON.stringify(handledResource));
      return callback(err, handledResource);
    });
  };
};

handlerEnforcer._update = function(handlers) {
  var original = handlers.update;
  return function(request, partialResource, callback) {
    original.call(handlers, request, partialResource, function(err, modifiedResource) {
      debug.handler.update(JSON.stringify(request.params), JSON.stringify(partialResource), JSON.stringify(err), JSON.stringify(modifiedResource));
      return callback(err, modifiedResource);
    });
  };
};

handlerEnforcer._delete = function(handlers) {
  var original = handlers.delete;
  return function(request, callback) {
    original.call(handlers, request, function(err) {
      debug.handler.delete(JSON.stringify(request.params), JSON.stringify(err));
      return callback(err);
    });
  };
};
