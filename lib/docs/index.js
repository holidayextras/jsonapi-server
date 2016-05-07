"use strict";
var documentation = module.exports = { };

var router = require("../router.js");
router.bindToServer({
  verb: "get",
  path: "/documentation"
}, function(request, resourceConfig, res) {
  var templateData = documentation.transform();

  res.render("main.hbs", templateData, function(err, html) {
    console.log(err);
    res.set("Content-Type", "text/html");
    res.end(html);
  });
});

documentation.using = function(jsonApi) {
  documentation._jsonApi = jsonApi;
};

documentation.transform = function() {
  var namespaces = documentation._computeNamespaces();

  var config = documentation._jsonApi._apiConfig;
  var result = {
    config: {
      name: config.title,
      description: config.description,
      version: config.version,
      host: config.hostname,
      port: config.port,
      base: config.base
    },
    resourceList: Object.keys(documentation._jsonApi._resources).map(function(i) {
      return {
        namespace: documentation._jsonApi._resources[i].namespace,
        resource: i
      };
    }),
    namespaces: namespaces.map(documentation._transformNamespace)
  };

  result.serialised = JSON.stringify(result, null, 2);
  return result;
};

documentation._computeNamespaces = function() {
  return Object.keys(documentation._jsonApi._resources).reduce(function(namespaces, resource) {
    resource = documentation._jsonApi._resources[resource];
    var requiredNamespace = resource.namespace;
    var matchingNamespace = namespaces.filter(function(someNamespace) {
      return someNamespace[0].namespace === requiredNamespace;
    }).pop();

    if (!matchingNamespace) {
      matchingNamespace = [ ];
      namespaces.push(matchingNamespace);
      matchingNamespace.id = namespaces.length - 1;
    }

    matchingNamespace.push(resource);
    matchingNamespace.sort(function(a, b) {
      return a.resource.localeCompare(b.resource);
    });
    return namespaces;
  }, [ ]);
};

documentation._transformNamespace = function(resources) {
  var result = {
    id: resources.id,
    dependencyGraph: documentation._makeDependencyGraphFor(resources),
    resources: resources.map(documentation._transformResource)
  };
  result.namespace = resources[0].namespace;
  return result;
};

var count = 0;
documentation._transformResource = function(resource) {
  var attributes = Object.keys(resource.attributes).map(function(attributeName) {
    var joiScheme = resource.attributes[attributeName];
    if (joiScheme.__as) return null;

    return {
      name: attributeName,
      description: joiScheme._description,
      type: joiScheme._type,
      ref: joiScheme.__many || joiScheme.__one,
      example: (joiScheme._examples || [])[0],
      required: ((joiScheme._flags || { }).presence === "required"),
      readonly: (joiScheme._meta.indexOf("readonly") !== -1 ),
      resourceSpecific: !((attributeName === "id") || (attributeName === "type"))
    };
  }).filter(function(i){ return i; });

  return {
    uid: count++,
    name: resource.resource,
    description: resource.description,
    namespace: resource.namespace,
    attributes: attributes,
    userAttributes: attributes.filter(function(i) {
      return !i.readonly && i.resourceSpecific;
    }),
    searchParams: Object.keys(resource.searchParams).map(function(attributeName) {
      var joiScheme = resource.searchParams[attributeName];

      return {
        name: attributeName,
        description: joiScheme._description,
        type: joiScheme._type,
        ref: joiScheme.__many || joiScheme.__one,
        example: (joiScheme._examples || [])[0],
        location: "query",
        required: ((joiScheme._flags || { }).presence === "required"),
        resourceSpecific: !((attributeName === "id") || (attributeName === "type"))
      };
    }),
    operations: ["search", "find", "create", "delete", "update"].filter(function(i) {
      return !!resource.handlers[i];
    }).map(function(i) {
      return {
        resource: resource.resource,
        type: i
      };
    })
  };
};

documentation._makeDependencyGraphFor = function(resources) {
  var nodes = [ ];
  var links = [ ];

  var tmp = { };
  resources.forEach(function(i) {
    tmp[i.resource] = i;
  });
  resources = tmp;

  for (var i in resources) {
    var someResource = resources[i];
    var someNode = {
      id: nodes.length,
      type: someResource.resource,
      r: someResource
    };
    someResource.n = someNode;
    nodes.push(someNode);
  }

  nodes.forEach(function(node){
    for (var j in node.r.attributes) {
      var someAttribute = node.r.attributes[j];
      var relationName = someAttribute.__one || someAttribute.__many;
      if (!relationName) continue;
      if (!resources[relationName]) {
        console.log("Couldnt find", relationName);
        continue;
      }
      links.push({
        source: node.id,
        target: resources[relationName].n.id,
        left: someAttribute.__as ? (someAttribute.__many ? 1 : 0) : null,
        right: !someAttribute.__as ? (someAttribute.__many ? 1 : 0) : null
      });
    }
  });

  nodes.forEach(function(node){
    node.r.n = undefined;
    node.r = undefined;
  });

  return JSON.stringify({
    nodes: nodes,
    links: links
  });
};
