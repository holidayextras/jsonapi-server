"use strict";
var request = require("request");
var assert = require("assert");
var jsonApiTestServer = require("../example/server.js");


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
      request(data, function(err, res) {
        assert.equal(err, null);
        assert.equal(res.statusCode, "401", "Expecting 401");

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
