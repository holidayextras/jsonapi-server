"use strict";
var postProcess = module.exports = { };

var _ = require("underscore");
var externalRequest = require("request").defaults({
  pool: { maxSockets: Infinity }
});
var async = require("async");
postProcess._applySort = require("./postProcessing/sort.js").action;
postProcess._applyFilter = require("./postProcessing/filter.js").action;
postProcess._applyIncludes = require("./postProcessing/include.js").action;
postProcess._applyFields = require("./postProcessing/fields.js").action;

postProcess.handle = function(request, response, callback) {
  async.waterfall([
    function(next) {
      return postProcess._applySort(request, response, next);
    },
    function(next) {
      return postProcess._applyFilter(request, response, next);
    },
    function(next) {
      return postProcess._applyIncludes(request, response, next);
    },
    function(next) {
      return postProcess._applyFields(request, response, next);
    }
  ], function(err) {
    return callback(err);
  });
};

postProcess._fetchRelatedResources = function(request, mainResource, callback) {

  // Fetch the other objects
  var dataItems = mainResource[request.params.relation];
  if (!(dataItems instanceof Array)) dataItems = [ dataItems ];

  var resourcesToFetch = dataItems.map(function(dataItem) {
    return "http://" + request.route.host + request.route.base + dataItem.type + "/" + dataItem.id;
  });
  async.map(resourcesToFetch, function(related, done) {
    externalRequest.get(related, function(err, externalRes, json) {
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
    var relatedResources = [].concat.apply([], otherResources);
    return callback(null, relatedResources);
  });
};

postProcess.fetchForeignKeys = function(request, items, schema, callback) {
  if (!(items instanceof Array)) {
    items = [ items ];
  }
  items.forEach(function(item) {
    Object.keys(schema).map(function(i) {
      return _.extend({ name: i }, schema[i]);
    }).filter(function(schemaProperty) {
      var settings = schemaProperty._settings;
      return settings && settings.__as;
    }).forEach(function(schemaProperty) {
      item[schemaProperty.name] = undefined;
    });
  });
  return callback();
};
