"use strict";
var postProcess = module.exports = { };

var _ = require("underscore");
var externalRequest = require("request").defaults({
  pool: { maxSockets: Infinity }
});
var async = require("async");
var debugExternalRequests = false;

postProcess.using = function(jsonApi) {
  postProcess._jsonApi = jsonApi;
};

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

postProcess._applySort = function(request, response, callback) {
  var sort = request.params.sort;
  var ascending = 1;
  if (!sort) return callback();
  sort = ("" + sort);
  if (sort[0] === "-") {
    ascending = -1;
    sort = sort.substring(1, sort.length);
  }

  if (!request.resourceConfig.attributes[sort]) {
    return callback({
      status: "403",
      code: "EFORBIDDEN",
      title: "Invalid sort",
      detail: request.resourceConfig.resource + " do not have property " + sort
    });
  }

  response.data = response.data.sort(function(a, b) {
    if (typeof a.attributes[sort] === "string") {
      return a.attributes[sort].localeCompare(b.attributes[sort]) * ascending;
    } else if (typeof a.attributes[sort] === "number") {
      return (a.attributes[sort] - b.attributes[sort]) * ascending;
    } else {
      return 0;
    }
  });

  return callback();
};

postProcess._applyFilter = function(request, response, callback) {
  var allFilters = request.params.filter;
  if (!allFilters) return callback();

  var filters = { };
  for (var i in allFilters) {
    if (!request.resourceConfig.attributes[i]) {
      return callback({
        status: "403",
        code: "EFORBIDDEN",
        title: "Invalid filter",
        detail: request.resourceConfig.resource + " do not have property " + i
      });
    }
    if (allFilters[i] instanceof Array) {
      allFilters[i] = allFilters[i].join(",");
    }
    if (typeof allFilters[i] === "string") {
      filters[i] = allFilters[i];
    }
  }

  if (response.data instanceof Array) {
    for (var j = 0; j < response.data.length; j++) {
      if (!postProcess._filterKeepObject(response.data[j], filters)) {
        response.data.splice(j, 1);
        j--;
      }
    }
  } else if (response.data instanceof Object) {
    if (!postProcess._filterKeepObject(response.data, filters)) {
      response.data = null;
    }
  }

  return callback();
};

postProcess._filterMatches = function(textToMatch, propertyText) {
  if (textToMatch[0] === ">") {
    textToMatch = textToMatch.substring(1);
    if (typeof propertyText === "number") textToMatch = parseInt(textToMatch, 10);
    if (textToMatch < propertyText) return true;
  } else if (textToMatch[0] === "<") {
    textToMatch = textToMatch.substring(1);
    if (typeof propertyText === "number") textToMatch = parseInt(textToMatch, 10);
    if (textToMatch > propertyText) return true;
  } else if (textToMatch[0] === "~") {
    if ((textToMatch.substring(1) + "").toLowerCase() === (propertyText + "").toLowerCase()) return true;
  } else if (textToMatch[0] === ":") {
    if ((propertyText + "").toLowerCase().indexOf((textToMatch.substring(1) + "").toLowerCase()) !== -1) return true;
  } else if (textToMatch === propertyText) return true;
};

postProcess._filterKeepObject = function(someObject, filters) {
  for (var k in filters) {
    var whitelist = filters[k].split(",");
    var propertyText = (someObject.attributes[k] || "");
    var matchOR = false;
    for (var j = 0; j < whitelist.length; j++) {
      var textToMatch = whitelist[j];
      if (postProcess._filterMatches(textToMatch, propertyText)) matchOR = true;
    }
    if (!matchOR) return false;
  }
  return true;
};

postProcess._applyIncludes = function(request, response, callback) {
  var includes = request.params.include;
  var filters = request.params.filter || { };
  if (!includes) return callback();
  includes = ("" + includes).split(",");

  postProcess._arrayToTree(request, includes, filters, function(attErr, includeTree) {
    if (attErr) return callback(attErr);

    var dataItems = response.data;
    if (!(dataItems instanceof Array)) dataItems = [ dataItems ];
    includeTree._dataItems = dataItems;

    postProcess._fillIncludeTree(includeTree, request, function(fiErr) {
      if (fiErr) return callback(fiErr);

      includeTree._dataItems = [ ];
      response.included = postProcess._getDataItemsFromTree(includeTree);
      response.included = _.uniq(response.included, false, function(someItem) {
        return someItem.type + "~~" + someItem.id;
      });

      return callback();
    });
  });
};

postProcess._arrayToTree = function(request, includes, filters, callback) {
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
        _resourceConfig: postProcess._jsonApi._resources[resourceAttribute],
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

postProcess._getDataItemsFromTree = function(tree) {
  var items = tree._dataItems;
  for (var i in tree) {
    if (i[0] !== "_") {
      items = items.concat(postProcess._getDataItemsFromTree(tree[i]));
    }
  }
  return items;
};

postProcess._fillIncludeTree = function(includeTree, request, callback) {
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
      var url = "http://" + request.route.host + dataItem.relationships[keyName].links.related;
      if (url.indexOf("?") === -1) url += "?";
      if (includeTree[keyName]._filter) {
        url += "&" + includeTree[keyName]._filter.join("&");
      }
      return keyName + "~~" + url;
    });
  });

  resourcesToFetch = [].concat.apply([], resourcesToFetch);
  resourcesToFetch = _.unique(resourcesToFetch);
  // console.log(resourcesToFetch);

  async.map(resourcesToFetch, function(related, done) {
    var parts = related.split("~~");
    var type = parts[0];
    var link = parts[1];
    if (debugExternalRequests) console.log(request.params.requestId, "Inc?", link);
    externalRequest.get(link, function(err, res, json) {
      if (debugExternalRequests) console.log(request.params.requestId, "Inc!", link);
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
      postProcess._fillIncludeTree(includeTree[include], request, done);
    }, callback);
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
    var relatedResources = [].concat.apply([], otherResources);
    return callback(null, relatedResources);
  });
};

postProcess._applyFields = function(request, response, callback) {
  var fields = request.params.fields;
  if (!fields || !(fields instanceof Object)) return callback();

  var allDataItems = response.included.concat(response.data);

  for (var resource in fields) {
    if (!postProcess._jsonApi._resources[resource]) {
      return callback({
        status: "403",
        code: "EFORBIDDEN",
        title: "Invalid field resource",
        detail: resource + " is not a valid resource "
      });
    }

    var field = ("" + fields[resource]).split(",");

    for (var i = 0; i < field.length; i++) {
      var j = field[i];
      if (!postProcess._jsonApi._resources[resource].attributes[j]) {
        return callback({
          status: "403",
          code: "EFORBIDDEN",
          title: "Invalid field selection",
          detail: resource + " do not have property " + j
        });
      }
    }
  }

  allDataItems.forEach(function(dataItem) {
    Object.keys(dataItem.attributes).forEach(function(attribute) {
      if (field.indexOf(attribute) === -1) {
        delete dataItem.attributes[attribute];
      }
    });
  });

  return callback();
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
