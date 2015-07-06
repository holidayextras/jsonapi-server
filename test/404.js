"use strict";
var request = require("request");
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApiTestServer = require("../example/server.js");


describe("Testing jsonapi-server", function() {
  describe("404 pages", function() {
    it("errors with invalid type #1", function(done) {
      var data = {
        method: "get",
        url: "http://localhost:16006/res"
      };
      request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "404", "Expecting 404");

        done();
      });
    });

    it("errors with invalid type #2", function(done) {
      var data = {
        method: "get",
        url: "http://localhost:16006/rest/a/b/c/d/e"
      };
      request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "404", "Expecting 404");

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
