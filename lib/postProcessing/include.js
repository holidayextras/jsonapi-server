"use strict";
var includePP = module.exports = { };

var jsonApi = require("../jsonApi.js");
var _ = require("underscore");
var externalRequest = require("request").defaults({
  pool: { maxSockets: Infinity }
});
var async = require("async");

includePP.action = function(request, response, callback) {
  var includes = request.params.include;
  var filters = request.params.filter || { };
  if (!includes) return callback();
  includes = ("" + includes).split(",");

  includePP._arrayToTree(request, includes, filters, function(attErr, includeTree) {
    if (attErr) return callback(attErr);

    var dataItems = response.data;
    if (!(dataItems instanceof Array)) dataItems = [ dataItems ];
    includeTree._dataItems = dataItems;

    includePP._fillIncludeTree(includeTree, request, function(fiErr) {
      if (fiErr) return callback(fiErr);

      includeTree._dataItems = [ ];
      response.included = includePP._getDataItemsFromTree(includeTree);
      response.included = _.uniq(response.included, false, function(someItem) {
        return someItem.type + "~~" + someItem.id;
      });

      return callback();
    });
  });
};

includePP._arrayToTree = function(request, includes, filters, callback) {
  var tree = {
    _dataItems: null,
    _resourceConfig: request.resourceConfig
  };

  var iterate = function(text, node, filter) {
    if (text.length === 0) return null;
    var parts = text.split(".");
    var first = parts.shift();
    var rest = parts.join(".");

    var resourceAttribute = node._resourceConfig.attributes[first];
    if (!resourceAttribute) {
      return callback({
        status: "403",
        code: "EFORBIDDEN",
        title: "Invalid inclusion",
        detail: node._resourceConfig.resource + " do not have property " + first
      });
    }
    resourceAttribute = resourceAttribute._settings.__one || resourceAttribute._settings.__many;
    if (!resourceAttribute) {
      return callback({
        status: "403",
        code: "EFORBIDDEN",
        title: "Invalid inclusion",
        detail: node._resourceConfig.resource + "." + first + " is not a relation and cannot be included"
      });
    }

    filter = filter[first] || { };
    if (!node[first]) {
      node[first] = {
        _dataItems: [ ],
        _resourceConfig: jsonApi._resources[resourceAttribute],
        _filter: [ ]
      };

      for (var i in filter) {
        if (!(typeof filter[i] === "string" || (filter[i] instanceof Array))) continue;
        node[first]._filter.push("filter[" + i + "]=" + filter[i]);
      }
    }
    iterate(rest, node[first], filter);
  };
  includes.forEach(function(include) {
    iterate(include, tree, filters);
  });

  return callback(null, tree);
};

includePP._getDataItemsFromTree = function(tree) {
  var items = tree._dataItems;
  for (var i in tree) {
    if (i[0] !== "_") {
      items = items.concat(includePP._getDataItemsFromTree(tree[i]));
    }
  }
  return items;
};

includePP._fillIncludeTree = function(includeTree, request, callback) {
  /****
  includeTree = {
    _dataItems: [ ],
    _filter: { },
    _resourceConfig: { },
    person: { includeTree },
    booking: { includeTree }
  };
  ****/
  var includes = Object.keys(includeTree);

  var resourcesToFetch = includeTree._dataItems.map(function(dataItem) {
    if (!dataItem) return [ ];
    return Object.keys(dataItem.relationships || { }).filter(function(keyName) {
      return (keyName[0] !== "_") && (includes.indexOf(keyName) !== -1);
    }).map(function(keyName) {
      var url = dataItem.relationships[keyName].links.related;
      if (url.indexOf("?") === -1) url += "?";
      if (includeTree[keyName]._filter) {
        url += "&" + includeTree[keyName]._filter.join("&");
      }
      return keyName + "~~" + url;
    });
  });

  resourcesToFetch = [].concat.apply([], resourcesToFetch);
  resourcesToFetch = _.unique(resourcesToFetch);

  async.map(resourcesToFetch, function(related, done) {
    var parts = related.split("~~");
    var type = parts[0];
    var link = parts[1];
    externalRequest.get(link, function(err, res, json) {
      if (err || !json) {
        return done(null);
      }

      try {
        json = JSON.parse(json);
      } catch(e) {
        json = null;
      }

      if (res.statusCode >= 400) {
        return done(json.errors);
      }

      var data = json.data;
      if (!data) return done();
      if (!(data instanceof Array)) data = [ data ];
      includeTree[type]._dataItems = includeTree[type]._dataItems.concat(data);
      return done();
    });
  }, function(err) {
    if (err) return callback(err);

    async.map(includes, function(include, done) {
      if (include[0] === "_") return done();
      includePP._fillIncludeTree(includeTree[include], request, done);
    }, callback);
  });
};
