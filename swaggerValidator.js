"use strict";
var jsonApiTestServer = require("./example/server.js");
var request = require("request");
var assert = require("assert");

describe("Use a tool to validate the generated swagger document", function() {
  it("should not contain any errors", function(done) {
    var validator = require("swagger-tools").specs.v2;

    var uri = "http://localhost:16006/rest/swagger.json";
    request(uri, function(meh, res, swaggerObject) {
      swaggerObject = JSON.parse(swaggerObject);

      validator.validate(swaggerObject, function (err, result) {
        assert.ifError(err);

        if (!result) {
          console.log("Swagger document is valid");
          return done();
        }

        if (result.errors.length > 0) {
          console.log("The Swagger document is invalid...");
          console.log("");
          console.log("Errors");
          console.log("------");
          console.log(result.errors);
          console.log("");
        }

        if (result.warnings.length > 0) {
          console.log("Warnings");
          console.log("--------");
          console.log(result.warnings);
        }

        done(new Error("Invalid swagger.json!"));
      });
    });
  });

  before(function() {
    jsonApiTestServer.start();
  });
  after(function() {
    jsonApiTestServer.close();
  });
});
