/* @flow weak */
"use strict";
var postProcess = module.exports = { };

var jsonApi = require("..");
var debug = require("./debugging.js");
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

  if (!dataItems) return callback(null, [ null ]);

  if (!(dataItems instanceof Array)) dataItems = [ dataItems ];

  var resourcesToFetch = dataItems.reduce(function(map, dataItem) {
    map[dataItem.type] = map[dataItem.type] || [ ];
    map[dataItem.type].push(dataItem.id);
    return map;
  }, { });

  resourcesToFetch = Object.keys(resourcesToFetch).map(function(type) {
    var ids = resourcesToFetch[type];
    var urlJoiner = "&filter[id]=";
    ids = urlJoiner + ids.join(urlJoiner);
    return jsonApi._apiConfig.pathPrefix + type + "/?" + ids;
  });

  async.map(resourcesToFetch, function(related, done) {
    debug.include(related);

    externalRequest({
      method: "GET",
      uri: related,
      headers: request.safeHeaders
    }, function(err, externalRes, json) {
      if (err || !json) return done(null, [ ]);

      try {
        json = JSON.parse(json);
      } catch(e) {
        json = null;
      }

      if (!json) return done(null, [ ]);

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
    for (var i in schema) {
      var settings = schema[i]._settings;
      if (settings && settings.__as) {
        item[i] = undefined;
      }
    }
  });
  return callback();
};
