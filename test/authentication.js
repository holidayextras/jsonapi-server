"use strict";
var request = require("request");
var assert = require("assert");
var jsonApiTestServer = require("../example/server.js");
var helpers = require("./helpers.js");

describe("Testing jsonapi-server", function() {
  describe("authentication", function() {
    it("blocks access with the blockMe header", function(done) {
      var data = {
        method: "get",
        url: "http://localhost:16006/rest/articles",
        headers: {
          "blockMe": "please"
        }
      };
      request(data, function(err, res, json) {
        assert.equal(err, null);
        assert.equal(res.statusCode, "401", "Expecting 401");
        helpers.validateError(json);
        done();
      });
    });

    it("blocks access with the blockMe cookies", function(done) {
      var data = {
        method: "get",
        url: "http://localhost:16006/rest/articles",
        headers: {
          "cookie": "blockMe=please"
        }
      };
      request(data, function(err, res, json) {
        assert.equal(err, null);
        assert.equal(res.statusCode, "401", "Expecting 401");
        helpers.validateError(json);
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
