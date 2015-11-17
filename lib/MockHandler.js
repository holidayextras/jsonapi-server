"use strict";
var _ = require("underscore");

var MemoryStore = module.exports = function MemoryStore() {
};

// resources represents out in-memory data store
var resources = { };



/**
  Handlers readiness status. This should be set to `true` once all handlers are ready to process requests.
 */
MemoryStore.prototype.ready = false;

/**
  initialise gets invoked once for each resource that uses this hander.
  In this instance, we're allocating an array in our in-memory data store.
 */
MemoryStore.prototype.initialise = function(resourceConfig) {
  resources[resourceConfig.resource] = resourceConfig.examples || [ ];
  this.ready = true;
};

/**
  Search for a list of resources, give a resource type.
 */
MemoryStore.prototype.search = function(request, callback) {
  // If a relationships param is passed in, filter against those relations
  if (request.params.relationships) {
    var mustMatch = request.params.relationships;
    var matches = resources[request.params.type].filter(function(anyResource) {
      var match = true;
      Object.keys(mustMatch).forEach(function(i) {
        var fKeys = anyResource[i];
        if (!(fKeys instanceof Array)) fKeys = [ fKeys ];
        fKeys = fKeys.map(function(j) { return j.id; });
        if (fKeys.indexOf(mustMatch[i]) === -1) {
          match = false;
        }
      });
      return match;
    });
    return callback(null, matches);
  }

  // No specific search params are supported, so return ALL resources of the requested type
  return callback(null, resources[request.params.type]);
};

/**
  Find a specific resource, given a resource type and and id.
 */
MemoryStore.prototype.find = function(request, callback) {
  // Pull the requested resource from the in-memory store
  var theResource = resources[request.params.type].filter(function(anyResource) {
    return anyResource.id === request.params.id;
  }).pop();

  // If the resource doesn't exist, error
  if (!theResource) {
    return callback({
      status: "404",
      code: "ENOTFOUND",
      title: "Requested resource does not exist",
      detail: "There is no " + request.params.type + " with id " + request.params.id
    });
  }

  // Return the requested resource
  return callback(null, theResource);
};

/**
  Create (store) a new resource give a resource type and an object.
 */
MemoryStore.prototype.create = function(request, newResource, callback) {
  // Push the newResource into our in-memory store.
  resources[request.params.type].push(newResource);
  // Return the newly created resource
  return callback(null, newResource);
};

/**
  Delete a resource, given a resource type and and id.
 */
MemoryStore.prototype.delete = function(request, callback) {
  // Find the requested resource
  this.find(request, function(err, theResource) {
    if (err) return callback(err);

    // Remove the resource from the in-meory store.
    var resourceIndex = resources[request.params.type].indexOf(theResource);
    resources[request.params.type].splice(resourceIndex, 1);

    // Return with no error
    return callback();
  });
};

/**
  Update a resource, given a resource type and id, along with a partialResource.
  partialResource contains a subset of changes that need to be merged over the original.
 */
MemoryStore.prototype.update = function(request, partialResource, callback) {
  // Find the requested resource
  this.find(request, function(err, theResource) {
    if (err) return callback(err);

    // Merge the partialResource over the original
    theResource = _.extend(theResource, partialResource);

    // Push the newly updated resource back into the in-memory store
    resources[request.params.type][request.params.id] = theResource;

    // Return the newly updated resource
    return callback(null, theResource);
  });
};
