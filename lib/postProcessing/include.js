/* @flow weak */
"use strict";
var includePP = module.exports = { };

var jsonApi = require("../jsonApi.js");
var _ = {
  uniq: require("lodash.uniq"),
  uniqBy: require("lodash.uniqby")
};
var rerouter = require("../rerouter.js");
var async = require("async");
var debug = require("../debugging.js");

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
      response.included = _.uniqBy(response.included, function(someItem) {
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
    if (filter instanceof Array) {
      filter = filter.filter(function(i) {
        return i instanceof Object;
      }).pop();
    }

    if (!node[first]) {
      node[first] = {
        _dataItems: [ ],
        _resourceConfig: jsonApi._resources[resourceAttribute],
        _filter: [ ]
      };

      if (!((filter instanceof Array) && (filter.length === 0))) {
        for (var i in filter) {
          if (!(typeof filter[i] === "string" || (filter[i] instanceof Array))) continue;
          node[first]._filter.push("filter[" + i + "]=" + filter[i]);
        }
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

  var map = {
    primary: { },
    foreign: { }
  };
  includeTree._dataItems.forEach(function(dataItem) {
    if (!dataItem) return [ ];
    return Object.keys(dataItem.relationships || { }).filter(function(keyName) {
      return (keyName[0] !== "_") && (includes.indexOf(keyName) !== -1);
    }).forEach(function(relation) {
      var someRelation = dataItem.relationships[relation];

      if (someRelation.meta.relation === "primary") {
        var relationItems = someRelation.data;
        if (!relationItems) return;
        if (!(relationItems instanceof Array)) relationItems = [ relationItems ];
        relationItems.forEach(function(relationItem) {
          var key = relationItem.type + "~~" + relation + "~~" + relation;
          map.primary[key] = map.primary[key] || [ ];
          map.primary[key].push(relationItem.id);
        });
      }

      if (someRelation.meta.relation === "foreign") {
        var key = someRelation.meta.as + "~~" + someRelation.meta.belongsTo + "~~" + relation;
        map.foreign[key] = map.foreign[key] || [ ];
        map.foreign[key].push(dataItem.id);
      }
    });
  });

  var resourcesToFetch = [];

  Object.keys(map.primary).forEach(function(relation) {
    var ids = _.uniq(map.primary[relation]);
    var parts = relation.split("~~");
    var urlJoiner = "&filter[id]=";
    ids = urlJoiner + ids.join(urlJoiner);
    if (includeTree[parts[1]]._filter) {
      ids += "&" + includeTree[parts[1]]._filter.join("&");
    }
    resourcesToFetch.push({
      url: jsonApi._apiConfig.pathPrefix + parts[0] + "/?" + ids,
      as: relation
    });
  });

  Object.keys(map.foreign).forEach(function(relation) {
    var ids = _.uniq(map.foreign[relation]);
    var parts = relation.split("~~");
    var urlJoiner = "&filter[" + parts[0] + "]=";
    ids = urlJoiner + ids.join(urlJoiner);
    if (includeTree[parts[2]]._filter) {
      ids += "&" + includeTree[parts[2]]._filter.join("&");
    }
    resourcesToFetch.push({
      url: jsonApi._apiConfig.pathPrefix + parts[1] + "/?" + ids,
      as: relation
    });
  });

  async.map(resourcesToFetch, function(related, done) {
    var parts = related.as.split("~~");
    debug.include(related);

    rerouter.route({
      method: "GET",
      uri: related.url,
      originalRequest: request
    }, function(err, json) {
      if (err) {
        debug.include("!!", JSON.stringify(err));
        return done(err.errors);
      }

      var data = json.data;
      if (!data) return done();
      if (!(data instanceof Array)) data = [ data ];
      includeTree[parts[2]]._dataItems = includeTree[parts[2]]._dataItems.concat(data);
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
