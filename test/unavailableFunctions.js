"use strict";
var request = require("request");
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApiTestServer = require("../example/server.js");


describe("Testing jsonapi-server", function() {
  describe("unavailable functions", function() {
    it("responds with a clear error", function(done) {
      var data = {
        method: "delete",
        url: "http://localhost:16006/rest/photos/14"
      };
      request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "403", "Expecting 403");
        assert.equal(json.errors[0].detail, "The requested resource 'photos' does not support 'delete'");

        done();
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
