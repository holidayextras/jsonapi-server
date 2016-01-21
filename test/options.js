"use strict";
var assert = require("assert");
var request = require("request");
var jsonApiTestServer = require("../example/server");


describe("Testing jsonapi-server", function() {

  describe("OPTIONS request", function() {

    it("returns 204", function(done) {
      var url = "http://localhost:16006/rest/";
      request({
        method: "OPTIONS",
        url: url
      }, function(err, res) {
        assert(!err);
        assert.strictEqual(res.statusCode, 204, "Expecting 200 OK");
        assert.equal(res.headers["content-type"], "application/vnd.api+json", "should have a content-type");
        assert.equal(res.headers["access-control-allow-origin"], "*", "should have CORS headers");
        assert.equal(res.headers["access-control-allow-methods"], "GET, POST, PATCH, DELETE, OPTIONS", "should have CORS headers");
        assert.equal(res.headers["access-control-allow-headers"], "", "should have CORS headers");
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
