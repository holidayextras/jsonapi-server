"use strict";
var handlers = module.exports = { };

var async = require("async");
var Joi = require("joi");
var externalRequest = require("request").defaults({
  pool: { maxSockets: Infinity }
});
var _ = require("underscore");
var uuid = require("node-uuid");
var router = require("./router.js");
var postProcess = require("./postProcess.js");
var responseHelper = require("./responseHelper.js");
var debugExternalRequests = false;

handlers.using = function(jsonApi) {
  handlers._jsonApi = jsonApi;
};

handlers._registerSearch = function() {
  router.bindToServer({
    verb: "get",
    path: router._jsonApi._apiConfig.base + ":type"
  }, function(request, resourceConfig, res) {
    var searchResults;
    var response;

    async.waterfall([
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "search", callback);
      },
      function(callback) {
        handlers._validate(request.params, resourceConfig.searchParams, callback);
      },
      function(callback) {
        resourceConfig.handlers.search(request, callback);
      },
      function(results, callback) {
        searchResults = results;
        postProcess.fetchForeignKeys(request, searchResults, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnArray(searchResults, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        response.included = [ ];
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return handlers._handleError(request, res, err);
      return router.sendResponse(res, response, 200);
    });
  });
};

handlers._registerFind = function() {
  router.bindToServer({
    verb: "get",
    path: router._jsonApi._apiConfig.base + ":type/:id"
  }, function(request, resourceConfig, res) {
    var resource;
    var response;

    async.waterfall([
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(result, callback) {
        resource = result;
        postProcess.fetchForeignKeys(request, resource, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnObject(resource, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        response.included = [ ];
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return handlers._handleError(request, res, err);
      return router.sendResponse(res, response, 200);
    });
  });
};

handlers._registerRelated = function() {
  router.bindToServer({
    verb: "get",
    path: router._jsonApi._apiConfig.base + ":type/:id/:relation"
  }, function(request, resourceConfig, res) {
    var relation;
    var mainResource;
    var relatedResources;
    var response;

    async.waterfall([
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        relation = resourceConfig.attributes[request.params.relation];
        if (!relation || !relation._settings || !(relation._settings.__one || relation._settings.__many)) {
          return callback({
            status: "404",
            code: "ENOTFOUND",
            title: "Resource not found",
            detail: "The requested relation does not exist within the requested type"
          });
        }
        callback();
      },
      function(callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(result, callback) {
        mainResource = result;

        // Fetch the other objects
        var dataItems = mainResource[request.params.relation];
        if (!(dataItems instanceof Array)) dataItems = [ dataItems ];

        var resourcesToFetch = dataItems.map(function(dataItem) {
          return "http://" + request.route.host + request.route.base + dataItem.type + "/" + dataItem.id;
        });
        async.map(resourcesToFetch, function(related, done) {
          if (debugExternalRequests) console.log(request.params.requestId, "Rel?", related);
          externalRequest.get(related, function(err, externalRes, json) {
            if (debugExternalRequests) console.log(request.params.requestId, "Rel!", related);
            if (err || !json) return done(null, [ ]);

            try {
              json = JSON.parse(json);
            } catch(e) {
              json = null;
            }

            if (externalRes.statusCode >= 400) {
              return done(json.errors);
            }

            var data = json.data;
            if (!(data instanceof Array)) data = [ data ];
            return done(null, data);
          });
        }, function(err, otherResources) {
          if (err) return callback(err);
          relatedResources = [].concat.apply([], otherResources);
          if (relation._settings.__one) {
            relatedResources = relatedResources[0];
          }
          return callback();
        });
      },
      function(callback) {
        request.resourceConfig = router._jsonApi._resources[relation._settings.__one || relation._settings.__many];
        response = responseHelper._generateResponse(request, resourceConfig, relatedResources);
        response.included = [ ];
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return handlers._handleError(request, res, err);
      return router.sendResponse(res, response, 200);
    });
  });
};

handlers._registerCreate = function() {
  router.bindToServer({
    verb: "post",
    path: router._jsonApi._apiConfig.base + ":type"
  }, function(request, resourceConfig, res) {
    var theirResource;
    var newResource;
    var response;

    async.waterfall([
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "create", callback);
      },
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        if (!request.params.data) {
          return callback({
            status: "403",
            code: "EFORBIDDEN",
            title: "Request validation failed",
            detail: "Missing \"data\" - have you sent the right http headers?"
          });
        }
        callback();
      },
      function(callback) {
        var theirs = request.params.data;
        theirResource = _.extend({
          id: uuid.v4(),
          type: request.params.type
        }, theirs.attributes);
        for (var i in theirs.relationships) {
          theirResource[i] = theirs.relationships[i].data;
        }
        handlers._validate(theirResource, resourceConfig.onCreate, callback);
      },
      function(callback) {
        resourceConfig.handlers.create(request, theirResource, callback);
      },
      function(result, callback) {
        newResource = result;
        request.params.id = newResource.id;
        resourceConfig.handlers.find(request, callback);
      },
      function(result, callback) {
        newResource = result;
        postProcess.fetchForeignKeys(request, newResource, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        request.route.path += "/" + newResource.id;
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return handlers._handleError(request, res, err);
      return router.sendResponse(res, response, 201);
    });
  });
};

handlers._registerDelete = function() {
  router.bindToServer({
    verb: "delete",
    path: router._jsonApi._apiConfig.base + ":type/:id"
  }, function(request, resourceConfig, res) {
    async.waterfall([
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "delete", callback);
      },
      function(callback) {
        resourceConfig.handlers.delete(request, callback);
      }
    ], function(err) {
      if (err) return handlers._handleError(request, res, err);

      var response = {
        meta: responseHelper._generateMeta(request)
      };
      router.sendResponse(res, response, 200);
    });
  });
};

handlers._registerUpdate = function() {
  router.bindToServer({
    verb: "patch",
    path: router._jsonApi._apiConfig.base + ":type/:id"
  }, function(request, resourceConfig, res) {
    var theirResource;
    var newResource;
    var response;

    async.waterfall([
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "update", callback);
      },
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        if (!request.params.data) {
          return callback({
            status: "403",
            code: "EFORBIDDEN",
            title: "Request validation failed",
            detail: "Missing \"data\" - have you sent the right http headers?"
          });
        }
        callback();
      },
      function(callback) {
        var theirs = request.params.data;
        theirResource = _.extend({
          id: request.params.id,
          type: request.params.type
        }, theirs.attributes);
        for (var i in theirs.relationships) {
          theirResource[i] = theirs.relationships[i].data;
        }
        handlers._validate(theirResource, resourceConfig.onCreate, callback);
      },
      function(callback) {
        resourceConfig.handlers.update(request, theirResource, callback);
      },
      function(result, callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(result, callback) {
        newResource = result;
        postProcess.fetchForeignKeys(request, newResource, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return handlers._handleError(request, res, err);
      router.sendResponse(res, response, 201);
    });
  });
};

handlers._registerForeignKeySearch = function() {
  router.bindToServer({
    verb: "get",
    path: router._jsonApi._apiConfig.base + ":type/relationships/"
  }, function(request, resourceConfig, res) {
    var foreignKey;
    var searchResults;
    var response;

    async.waterfall([
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "search", callback);
      },
      function(callback) {
        foreignKey = Object.keys(request.params).filter(function(param) {
          return ["include", "type", "sort", "filter", "fields", "requestId"].indexOf(param) === -1;
        }).pop();
        request.params.relationships = { };
        request.params.relationships[foreignKey] = request.params[foreignKey];
        delete request.params[foreignKey];
        callback();
      },
      function(callback) {
        var foreignKeySchema = resourceConfig.attributes[foreignKey];
        if (!foreignKeySchema || !foreignKeySchema._settings) {
          return callback({
            status: "403",
            code: "EFORBIDDEN",
            title: "Invalid foreign key lookup",
            detail: "Relation [" + foreignKey + "] does not exist within " + request.params.type
          });
        }
        if (!(foreignKeySchema._settings.__one || foreignKeySchema._settings.__many)) {
          return callback({
            status: "403",
            code: "EFORBIDDEN",
            title: "Invalid foreign key lookup",
            detail: "Attribute [" + foreignKey + "] does not represent a relation within " + request.params.type
          });
        }
        callback();
      },
      function(callback) {
        resourceConfig.handlers.search(request, callback);
      },
      function(results, callback) {
        searchResults = results.map(function(result) {
          return {
            id: result.id,
            type: result.type
          };
        });
        if (resourceConfig.attributes[foreignKey]) {
          searchResults = searchResults[0] || null;
        }
        callback();
      },
      function(callback) {
        response = responseHelper._generateResponse(request, resourceConfig, searchResults);
        response.included = [ ];
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return handlers._handleError(request, res, err);
      return router.sendResponse(res, response, 200);
    });
  });
};

handlers._registerRelationships = function() {
  router.bindToServer({
    verb: "get",
    path: router._jsonApi._apiConfig.base + ":type/:id/relationships/:relation"
  }, function(request, resourceConfig, res) {
    var resource;
    var response;

    async.waterfall([
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        var relation = resourceConfig.attributes[request.params.relation];
        if (!relation || !(relation._settings.__one || relation._settings.__many)) {
          return callback({
            status: "404",
            code: "ENOTFOUND",
            title: "Resource not found",
            detail: "The requested relation does not exist within the requested type"
          });
        }
        callback();
      },
      function(callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(result, callback) {
        resource = result;
        postProcess.fetchForeignKeys(request, resource, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnObject(resource, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        sanitisedData = sanitisedData.relationships[request.params.relation].data;
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        callback();
      }
    ], function(err) {
      if (err) return handlers._handleError(request, res, err);
      return router.sendResponse(res, response, 200);
    });
  });
};

handlers._registerUpdateRelation = function() {
  router.bindToServer({
    verb: "patch",
    path: router._jsonApi._apiConfig.base + ":type/:id/relationships/:relation"
  }, function(request, resourceConfig, res) {
    var newResource;
    var theirResource;
    var response;

    async.waterfall([
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "update", callback);
      },
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        if (!request.params.data) {
          return callback({
            status: "403",
            code: "EFORBIDDEN",
            title: "Request validation failed",
            detail: "Missing \"data\" - have you sent the right http headers?"
          });
        }
        callback();
      },
      function(callback) {
        var theirs = request.params.data;
        theirResource = _.extend({
          id: request.params.id,
          type: request.params.type
        });
        theirResource[request.params.relation] = theirs;
        handlers._validate(theirResource, resourceConfig.onCreate, callback);
      },
      function(callback) {
        resourceConfig.handlers.update(request, theirResource, callback);
      },
      function(result, callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(result, callback) {
        newResource = result;
        postProcess.fetchForeignKeys(request, newResource, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        sanitisedData = sanitisedData.relationships[request.params.relation].data;
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return handlers._handleError(request, res, err);
      router.sendResponse(res, response, 201);
    });
  });
};

handlers._registerAddRelation = function() {
  router.bindToServer({
    verb: "post",
    path: router._jsonApi._apiConfig.base + ":type/:id/relationships/:relation"
  }, function(request, resourceConfig, res) {
    var newResource;
    var theirResource;
    var response;

    async.waterfall([
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "update", callback);
      },
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        if (!request.params.data) {
          return callback({
            status: "403",
            code: "EFORBIDDEN",
            title: "Request validation failed",
            detail: "Missing \"data\" - have you sent the right http headers?"
          });
        }
        callback();
      },
      function(callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(ourResource, callback) {
        theirResource = ourResource;

        var theirs = request.params.data;
        theirResource[request.params.relation] = theirResource[request.params.relation] || [ ];
        theirResource[request.params.relation].push(theirs);
        handlers._validate(theirResource, resourceConfig.onCreate, callback);
      },
      function(callback) {
        resourceConfig.handlers.update(request, theirResource, callback);
      },
      function(result, callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(result, callback) {
        newResource = result;
        postProcess.fetchForeignKeys(request, newResource, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        sanitisedData = sanitisedData.relationships[request.params.relation].data;
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return handlers._handleError(request, res, err);
      router.sendResponse(res, response, 201);
    });
  });
};

handlers._registerRemoveRelation = function() {
  router.bindToServer({
    verb: "delete",
    path: router._jsonApi._apiConfig.base + ":type/:id/relationships/:relation"
  }, function(request, resourceConfig, res) {
    var newResource;
    var theirResource;
    var response;

    async.waterfall([
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "update", callback);
      },
      function(callback) {
        handlers._verifyRequest(request, resourceConfig, res, "find", callback);
      },
      function(callback) {
        if (!request.params.data) {
          return callback({
            status: "403",
            code: "EFORBIDDEN",
            title: "Request validation failed",
            detail: "Missing \"data\" - have you sent the right http headers?"
          });
        }
        callback();
      },
      function(callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(ourResource, callback) {
        theirResource = ourResource;

        var theirs = request.params.data;
        theirResource[request.params.relation] = theirResource[request.params.relation] || [ ];
        if (!(theirs instanceof Array)) theirs = [ theirs ];

        var keys = theirResource[request.params.relation].map(function(j) {
          return j.id;
        });

        for (var i = 0; i < theirs.length; i++) {
          if (theirs[i].type !== request.params.relation) {
            return callback({
              status: "403",
              code: "EFORBIDDEN",
              title: "Invalid Request",
              detail: "Invalid type " + theirs[i].type
            });
          }
          var someId = theirs[i].id;
          var indexOfTheirs = keys.indexOf(someId);
          if (indexOfTheirs === -1) {
            return callback({
              status: "403",
              code: "EFORBIDDEN",
              title: "Invalid Request",
              detail: "Unknown id " + someId
            });
          }
          theirResource[request.params.relation].splice(indexOfTheirs, 1);
        }

        handlers._validate(theirResource, resourceConfig.onCreate, callback);
      },
      function(callback) {
        resourceConfig.handlers.update(request, theirResource, callback);
      },
      function(result, callback) {
        resourceConfig.handlers.find(request, callback);
      },
      function(result, callback) {
        newResource = result;
        postProcess.fetchForeignKeys(request, newResource, resourceConfig.attributes, callback);
      },
      function(callback) {
        responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes, callback);
      },
      function(sanitisedData, callback) {
        sanitisedData = sanitisedData.relationships[request.params.relation].data;
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData);
        postProcess.handle(request, response, callback);
      }
    ], function(err) {
      if (err) return handlers._handleError(request, res, err);
      router.sendResponse(res, response, 201);
    });
  });
};

handlers._validate = function(someObject, someDefinition, callback) {
  if (!someObject || !someDefinition) {
    return callback({
      status: "500",
      code: "EUNKNOWN",
      title: "An unknown error has occured. Sorry?",
      detail: "Missing parameters for handler validation"
    });
  }

  Joi.validate(someObject, someDefinition, function (err) {
    if (err) {
      return callback({
        status: "403",
        code: "EFORBIDDEN",
        title: "Param validation failed",
        detail: err
      });
    }
    callback();
  });
};

handlers._handleError = function(request, res, err) {
  var errorResponse = responseHelper.generateError(request, err);
  var httpCode = errorResponse.errors[0].status || 500;
  return router.sendResponse(res, errorResponse, httpCode);
};

handlers._verifyRequest = function(request, resourceConfig, res, handlerRequest, callback) {
  if (!resourceConfig) {
    return handlers._handleError(request, res, {
      status: "404",
      code: "ENOTFOUND",
      title: "Resource not found",
      detail: "The requested resource does not exist"
    });
  }

  if (!resourceConfig.handlers[handlerRequest]) {
    return handlers._handleError(request, res, {
      status: "403",
      code: "EFORBIDDEN",
      title: "Resource not supported",
      detail: "The requested resource is not supported"
    });
  }

  return callback();
};
