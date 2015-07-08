"use strict";
var responseHelper = module.exports = { };

var _ = require("underscore");
var async = require("async");
var Joi = require("joi");

responseHelper.setBaseUrl = function(baseUrl) {
  responseHelper._baseUrl = baseUrl;
};
responseHelper.setMetadata = function(meta) {
  responseHelper._metadata = meta;
};

responseHelper._enforceSchemaOnArray = function(items, schema, callback) {
  if (!(items instanceof Array)) {
    items = [ items ];
  }
  async.map(items, function(item, done) {
    return responseHelper._enforceSchemaOnObject(item, schema, done);
  }, function(err, results) {
    if (err) return callback(err);

    results = results.filter(function(result) {
      return !!result;
    });
    return callback(null, results);
  });
};

responseHelper._enforceSchemaOnObject = function(item, schema, callback) {
  Joi.validate(item, schema, function (err) {
    if (err) {
      console.log("Failed to validate internal object?!", JSON.stringify(arguments));
      return callback(null);
    }

    var dataItem = responseHelper._generateDataItem(item, schema);
    return callback(null, dataItem);
  });
};

responseHelper._generateDataItem = function(item, schema) {

  var isSpecialProperty = function(value) {
    if (!(value instanceof Object)) return false;
    if (value._settings) return true;
    return false;
  };
  var linkProperties = Object.keys(schema).filter(function(someProperty) {
    return isSpecialProperty(schema[someProperty]);
  });
  var attributeProperties = Object.keys(schema).filter(function(someProperty) {
    if ((someProperty === "id") || (someProperty === "type")) return false;
    return !isSpecialProperty(schema[someProperty]);
  });

  var result = {
    type: item.type,
    id: item.id,
    attributes: _.pick(item, attributeProperties),
    links: responseHelper._generateLinks(item, schema, linkProperties),
    relationships: responseHelper._generateRelationships(item, schema, linkProperties)
  };

  return result;
};

responseHelper._generateLinks = function(item) {
  return {
    self: responseHelper._baseUrl + item.type + "/" + item.id
  };
};

responseHelper._generateRelationships = function(item, schema, linkProperties) {
  if (linkProperties.length === 0) return undefined;

  var links = { };

  linkProperties.forEach(function(linkProperty) {
    links[linkProperty] = responseHelper._generateLink(item, schema[linkProperty], linkProperty);
  });

  return links;
};

responseHelper._generateLink = function(item, schemaProperty, linkProperty) {
  var link = {
    meta: {
      relation: "primary",
      // type: schemaProperty._settings.__many || schemaProperty._settings.__,
      readOnly: false
    },
    links: {
      self: responseHelper._baseUrl + item.type + "/" + item.id + "/relationships/" + linkProperty,
      related: responseHelper._baseUrl + item.type + "/" + item.id + "/" + linkProperty
    },
    data: null
  };

  if (schemaProperty._settings.__many) {
    link.data = [ ];
    var linkItems = item[linkProperty];
    if (linkItems) {
      if (!(linkItems instanceof Array)) linkItems = [ linkItems ];
      linkItems.forEach(function(linkItem) {
        link.data.push({
          type: linkItem.type,
          id: linkItem.id
        });
      });
    }
  }

  if (schemaProperty._settings.__one) {
    var linkItem = item[linkProperty];
    if (linkItem) {
      link.data = {
        type: linkItem.type,
        id: linkItem.id
      };
    }
  }

  if (schemaProperty._settings.__as) {
    var relatedResource = schemaProperty._settings.__one || schemaProperty._settings.__many;
    // get information about the linkage - list of ids and types
    // /rest/bookings/relationships/?customer=26aa8a92-2845-4e40-999f-1fa006ec8c63
    link.links.self = responseHelper._baseUrl + relatedResource + "/relationships/?" + schemaProperty._settings.__as + "=" + item.id;
    // get full details of all linked resources
    // /rest/bookings/?relationships[customer]=26aa8a92-2845-4e40-999f-1fa006ec8c63
    link.links.related = responseHelper._baseUrl + relatedResource + "/?relationships[" + schemaProperty._settings.__as + "]=" + item.id;
    if (!item[linkProperty]) {
      link.data = undefined;
    }
    link.meta = {
      relation: "foreign",
      belongsTo: relatedResource,
      as: schemaProperty._settings.__as,
      many: !!schemaProperty._settings.__many,
      readOnly: true
    };
  }

  return link;
};

responseHelper.generateError = function(request, err) {

  if (!(err instanceof Array)) err = [ err ];

  var errorResponse = {
    meta: responseHelper._generateMeta(request),
    links: {
      self: request.route.path
    },
    errors: err.map(function(error) {
      return {
        status: error.status,
        code: error.code,
        title: error.title,
        detail: error.detail
      };
    })
  };

  return errorResponse;
};

responseHelper._generateResponse = function(request, resourceConfig, sanitisedData) {
  return {
    meta: responseHelper._generateMeta(request),
    links: {
      self: request.route.path + (request.route.query ? ("?" + request.route.query) : "")
    },
    data: sanitisedData
  };
};

responseHelper._generateMeta = function() {
  return responseHelper._metadata;
};
