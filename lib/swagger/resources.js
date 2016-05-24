"use strict";
var swaggerPaths = module.exports = { };
var jsonApi = require("../../");


swaggerPaths.getResourceDefinitions = function() {
  var resourceDefinitions = { };

  for (var resource in jsonApi._resources) {
    resourceDefinitions[resource] = swaggerPaths._getResourceDefinition(jsonApi._resources[resource]);
  }
  resourceDefinitions.error = swaggerPaths._getErrorDefinition();

  return resourceDefinitions;
};

swaggerPaths._getResourceDefinition = function(resourceConfig) {
  if (Object.keys(resourceConfig.handlers || { }).length === 0) return undefined;

  var resourceDefinition = {
    description: resourceConfig.description,
    type: "object",
    // required: [ "id", "type", "attributes", "relationships", "links" ],
    properties: {
      "id": {
        type: "string"
      },
      "type": {
        type: "string"
      },
      "attributes": {
        type: "object",
        properties: { }
      },
      "relationships": {
        type: "object",
        properties: { }
      },
      "links": {
        type: "object",
        properties: {
          self: {
            type: "string"
          }
        }
      },
      "meta": {
        type: "object"
      }
    }
  };
  var attributeShortcut = resourceDefinition.properties.attributes.properties;
  var relationshipsShortcut = resourceDefinition.properties.relationships.properties;


  var attributes = resourceConfig.attributes;
  for (var attribute in attributes) {
    if ((attribute === "id") || (attribute === "type") || (attribute === "meta")) continue;

    var joiScheme = attributes[attribute];

    var swaggerScheme = { };
    if (joiScheme._description) {
      swaggerScheme.description = joiScheme._description;
    }

    if (!joiScheme._settings) {
      swaggerScheme.type = joiScheme._type;
      if (swaggerScheme.type === "date") {
        swaggerScheme.type = "string";
        swaggerScheme.format = "date";
      }
      attributeShortcut[attribute] = swaggerScheme;

      if ((joiScheme._flags || { }).presence === "required") {
        resourceDefinition.properties.attributes.required = resourceDefinition.properties.attributes.required || [ ];
        resourceDefinition.properties.attributes.required.push(attribute);
      }
    } else {
      if (joiScheme._settings.as) continue;

      swaggerScheme = {
        type: "object",
        properties: {
          meta: {
            type: "object"
          },
          links: {
            type: "object",
            properties: {
              self: {
                type: "string"
              },
              related: {
                type: "string"
              }
            }
          },
          data: {
            type: "object",
            required: [ "type", "id" ],
            properties: {
              type: {
                type: "string"
              },
              id: {
                type: "string"
              },
              meta: {
                type: "object"
              }
            }
          }
        }
      };

      if (joiScheme._settings.__many) {
        swaggerScheme.properties.data = {
          type: "array",
          items: swaggerScheme.properties.data
        };
      }

      if ((joiScheme._flags || { }).presence === "required") {
        if (joiScheme._settings.__many) {
          swaggerScheme.required = true;
        } else {
          swaggerScheme.required = [ "type", "id" ];
        }
      }
      relationshipsShortcut[attribute] = swaggerScheme;
    }
  }

  return resourceDefinition;
};

swaggerPaths._getErrorDefinition = function() {
  return {
    type: "object",
    required: [ "jsonapi", "meta", "links", "errors" ],
    properties: {
      jsonapi: {
        type: "object",
        required: [ "version" ],
        properties: {
          version: {
            type: "string"
          }
        }
      },
      meta: {
        type: "object"
      },
      links: {
        type: "object",
        properties: {
          self: {
            type: "string"
          }
        }
      },
      errors: {
        type: "array",
        items: {
          type: "object",
          required: [
            "status", "code", "title", "detail"
          ],
          properties: {
            status: {
              type: "string"
            },
            code: {
              type: "string"
            },
            title: {
              type: "string"
            },
            detail: {
              type: "object"
            }
          }
        }
      }
    }
  };
};
