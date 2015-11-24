"use strict";
var handlerEnforcer = module.exports = { };

var debug = require("debug");
var debugging = {
  search: debug("jsonApi:handler:search"),
  find: debug("jsonApi:handler:find"),
  create: debug("jsonApi:handler:create"),
  update: debug("jsonApi:handler:update"),
  delete: debug("jsonApi:handler:delete")
};

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
      debugging.search(JSON.stringify(request.params), JSON.stringify(err), JSON.stringify(resources));
      return callback(err, resources);
    });
  };
};

handlerEnforcer._find = function(handlers) {
  var original = handlers.find;
  return function(request, callback) {
    original.call(handlers, request, function(err, resource) {
      debugging.find(JSON.stringify(request.params), JSON.stringify(err), JSON.stringify(resource));
      return callback(err, resource);
    });
  };
};

handlerEnforcer._create = function(handlers) {
  var original = handlers.create;
  return function(request, newResource, callback) {
    original.call(handlers, request, newResource, function(err, handledResource) {
      debugging.create(JSON.stringify(request.params), JSON.stringify(newResource), JSON.stringify(err), JSON.stringify(handledResource));
      return callback(err, handledResource);
    });
  };
};

handlerEnforcer._update = function(handlers) {
  var original = handlers.update;
  return function(request, partialResource, callback) {
    original.call(handlers, request, partialResource, function(err, modifiedResource) {
      debugging.update(JSON.stringify(request.params), JSON.stringify(partialResource), JSON.stringify(err), JSON.stringify(modifiedResource));
      return callback(err, modifiedResource);
    });
  };
};

handlerEnforcer._delete = function(handlers) {
  var original = handlers.delete;
  return function(request, callback) {
    original.call(handlers, request, function(err) {
      debugging.delete(JSON.stringify(request.params), JSON.stringify(err));
      return callback(err);
    });
  };
};
