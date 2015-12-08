"use strict";
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApiTestServer = require("../example/server.js");


describe("Testing jsonapi-server", function() {
  describe("forward lookup", function() {
    it("unknown id should error", function(done) {
      var url = "http://localhost:16006/rest/articles/foobar/relationships/author";
      helpers.request({
        method: "GET",
        url: url
      }, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "404", "Expecting 404");

        done();
      });
    });

    it("unknown relation should error", function(done) {
      var url = "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/relationships/foobar";
      helpers.request({
        method: "GET",
        url: url
      }, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "404", "Expecting 404");

        done();
      });
    });

    it("Lookup by id", function(done) {
      var url = "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/relationships/author";
      helpers.request({
        method: "GET",
        url: url
      }, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateJson(json);

        assert.equal(res.statusCode, "200", "Expecting 200 OK");
        assert.equal(json.data.type, "people", "Should be a people resource");

        assert.ok(json instanceof Object, "Response should be an object");
        assert.ok(json.meta instanceof Object, "Response should have a meta block");
        assert.ok(json.links instanceof Object, "Response should have a links block");
        assert.equal(typeof json.links.self, "string", "Response should have a \"self\" link");

        var someDataBlock = json.data;
        if (!(someDataBlock instanceof Array)) someDataBlock = [ someDataBlock ];
        someDataBlock.forEach(function(dataBlock) {
          var keys = Object.keys(dataBlock);
          assert.deepEqual(keys, [ "type", "id", "meta" ], "Relationship data blocks should have specific properties");
          assert.equal(typeof dataBlock.id, "string", "Relationship data blocks id should be string");
          assert.equal(typeof dataBlock.type, "string", "Relationship data blocks type should be string");
        });

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
