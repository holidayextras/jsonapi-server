"use strict";
// http://docs.aws.amazon.com/amazondynamodb/latest/gettingstartedguide/Welcome.html
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html
var AWS = require("aws-sdk");
var _ = require("underscore");

var DynamoStore = module.exports = function DynameoStore(config) {

  this.dynamodb = new AWS.DynamoDB();
  AWS.config.update(config);


};

/**
  Handlers readiness status. This should be set to `true` once all handlers are ready to process requests.
 */
DynamoStore.ready = false;

/**
  initialise gets invoked once for each resource that uses this hander.
  In this instance, we're allocating an array in our in-memory data store.
 */
DynamoStore.prototype.initialise = function(resourceConfig) {
  var self = this;

  self.resourceConfig = resourceConfig;
  self.primaryRelations = Object.keys(resourceConfig.attributes).filter(function(attributeName) {
    var settings = resourceConfig.attributes[attributeName]._settings;
    return settings && !settings.__as && (settings.__one || settings.__many);
  });

  self._checkTableExists(resourceConfig, function(err) {
    if (false && !err) {
      self.ready = true;
      return;
    }
self.dynamodb.deleteTable({ TableName: resourceConfig.resource }, function() {
    self._createTable(resourceConfig, function() {
      self._populateTable(resourceConfig.examples);
      self.ready = true;
    });
});
  });
};

DynamoStore.prototype._checkTableExists = function(resourceConfig, callback) {
  var self = this;
  self.dynamodb.listTables({ }, function(err, data) {
    if (err) throw err;

    var validTable = data.TableNames.filter(function(someTableName) {
      return someTableName === resourceConfig.resource;
    });

    if (validTable.length === 0) return callback("Table doesn't exist");
    return callback();
  });
};
DynamoStore.prototype._createTable = function(resourceConfig, callback) {
  var self = this;

  var params = {
    TableName: resourceConfig.resource,
    KeySchema: [
      { AttributeName: "id", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "id", AttributeType: "S" }
    ].concat(self.primaryRelations.map(function(attributeName) {
      return { AttributeName: attributeName, AttributeType: "S" };
    })),
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }
  };

  if (self.primaryRelations.length > 0) {
    params.GlobalSecondaryIndexes = self.primaryRelations.map(function(attributeName) {
      return {
        IndexName: attributeName + "Index",
        KeySchema: [
          { AttributeName: attributeName, KeyType: "HASH" }
        ],
        Projection: {
          ProjectionType: "ALL"
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      };
    });
  }

  self.dynamodb.createTable(params, function(err, result) {
    if (err) throw err;

    if (result.TableDescription.TableStatus === "ACTIVE") {
      return callback();
    }

    return callback(); // TODO wait for table to become ready?
  });
};
DynamoStore.prototype._populateTable = function(examples) {
  var self = this;
  (examples || [ ]).forEach(function(example) {
    self.create(null, example, function(err) {
      if (err) throw err;
    });
  });
};

/**
  Search for a list of resources, give a resource type.
 */
DynamoStore.prototype.search = function(request, callback) {
  var self = this;
  // If a relationships param is passed in, filter against those relations
  var params = {
    TableName: "Movies",
    KeyConditionExpression: "#yr = :yyyy",
    ExpressionAttributeNames: {
        "#yr": "year"
    },
    ExpressionAttributeValues: {
      ":yyyy": 1985
    }
  };

  self.dynamodb.query(params, function(err, data) {
      if (err) {
          console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      } else {
          console.log("Query succeeded.");
          data.Items.forEach(function(item) {
              console.log(" -", item.year + ": " + item.title);
          });
      }
      return callback(null);
  });
};

/**
  Find a specific resource, given a resource type and and id.
 */
DynamoStore.prototype.find = function(request, callback) {
  var self = this;

  var params = {
      TableName: "Movies",
      KeyConditionExpression: "#yr = :yyyy",
      ExpressionAttributeNames: {
        "#yr": "year"
      },
      ExpressionAttributeValues: {
        ":yyyy": 1985
      }
  };

  self.dynamodb.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
        data.Items.forEach(function(item) {
            console.log(" -", item.year + ": " + item.title);
        });
    }

    // If the resource doesn't exist, error
    if (!self.dynamodb) {
      return callback({
        status: "404",
        code: "ENOTFOUND",
        title: "Requested resource does not exist",
        detail: "There is no " + request.params.type + " with id " + request.params.id
      });
    }

    // Return the requested resource
    return callback(null, false);
  });
};

/**
  Create (store) a new resource give a resource type and an object.
 */
DynamoStore.prototype.create = function(request, newResource, callback) {
  var self = this;

  var params = {
    TableName: self.resourceConfig.resource,
    Item: self._deflateResource(newResource)
  };

  console.log("Adding a new item...", params);
  self.dynamodb.putItem(params, function(err, data) {
      if (err) {
          console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Added item:", JSON.stringify(data, null, 2));
      }
      return callback(null, newResource);
  });
};

/**
  Delete a resource, given a resource type and and id.
 */
DynamoStore.prototype.delete = function(request, callback) {
  var self = this;

  var params = {
    TableName: request.params.type,
    Key: {
      "year": "year",
      "title": "title"
    },
    ConditionExpression: "info.rating <= :val",
    ExpressionAttributeValues: {
      ":val": 5.0
    }
  };

  console.log("Attempting a conditional delete...");
  self.dynamodb.delete(params, function(err, data) {
      if (err) {
          console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
      }
    return callback();
  });
};

/**
  Update a resource, given a resource type and id, along with a partialResource.
  partialResource contains a subset of changes that need to be merged over the original.
 */
DynamoStore.prototype.update = function(request, partialResource, callback) {
  var self = this;
  var params = {
    TableName: request.params.type,
    Key: {
        "year": "year",
        "title": "title"
    },
    UpdateExpression: "set info.rating = :r, info.plot=:p, info.actors=:a",
    ExpressionAttributeValues: {
        ":r": 5.5,
        ":p": "Everything happens all at once.",
        ":a": ["Larry", "Moe", "Curly"]
    },
    ReturnValues: "UPDATED_NEW"
};

console.log("Updating the item...");
self.dynamodb.update(params, function(err, data) {
    if (err) {
        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    }
    return callback(null, false);
  });
};


DynamoStore.prototype._deflateResource = function(someResource) {
  var self = this;

  var newResource = _.extend({ }, someResource);

  Object.keys(self.resourceConfig.attributes).forEach(function(attributeName) {
    var settings = self.resourceConfig.attributes[attributeName]._settings;
    if (!settings || settings.__as) return;

    if (settings.__one) {
      newResource[attributeName] = someResource[attributeName].id;
    } else if (settings.__many) {
      newResource[attributeName] = someResource[attributeName].map(function(relation) {
        return relation.id;
      });
    }
  });

  return newResource;
};

DynamoStore.prototype._inflateResource = function(someResource) {
  var self = this;

  var newResource = _.extend({ }, someResource);

  Object.keys(self.resourceConfig.attributes).forEach(function(attributeName) {
    var settings = self.resourceConfig.attributes[attributeName]._settings;
    if (!settings || settings.__as) return;

    if (settings.__one) {
      newResource[attributeName] = {
        id: someResource[attributeName],
        type: settings.__one
      };
    } else if (settings.__many) {
      newResource[attributeName] = someResource[attributeName].map(function(id) {
        return {
          id: id,
          type: settings.__many
        };
      });
    }
  });

  return newResource;
};
