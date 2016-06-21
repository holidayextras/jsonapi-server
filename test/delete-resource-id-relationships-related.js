"use strict";
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApiTestServer = require("../example/server.js");


describe("Testing jsonapi-server", function() {
  describe("Removing from a relation", function() {
    it("errors with invalid type", function(done) {
      var data = {
        method: "delete",
        url: "http://localhost:16006/rest/foobar/someId/relationships/author"
      };
      helpers.request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "404", "Expecting 404");

        done();
      });
    });

    it("errors with invalid id", function(done) {
      var data = {
        method: "delete",
        url: "http://localhost:16006/rest/articles/foobar/relationships/photos",
        headers: {
          "Content-Type": "application/vnd.api+json"
        },
        body: JSON.stringify({
          "data": { "type": "people", "id": "fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5" }
        })
      };
      helpers.request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "404", "Expecting 404");

        done();
      });
    });

    it("errors with unknown key", function(done) {
      var data = {
        method: "delete",
        url: "http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags",
        headers: {
          "Content-Type": "application/vnd.api+json"
        },
        body: JSON.stringify({
          "data": { "type": "tags", "id": "foobar" }
        })
      };
      helpers.request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "403", "Expecting 403");

        done();
      });
    });

    it("errors with invalid type", function(done) {
      var data = {
        method: "delete",
        url: "http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags",
        headers: {
          "Content-Type": "application/vnd.api+json"
        },
        body: JSON.stringify({
          "data": { "type": "people", "id": "7541a4de-4986-4597-81b9-cf31b6762486" }
        })
      };
      helpers.request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "403", "Expecting 403");

        done();
      });
    });

    describe("deleting", function() {
      it("deletes the resource on many()", function(done) {
        var data = {
          method: "delete",
          url: "http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags",
          headers: {
            "Content-Type": "application/vnd.api+json"
          },
          body: JSON.stringify({
            "data": { "type": "tags", "id": "7541a4de-4986-4597-81b9-cf31b6762486" }
          })
        };
        helpers.request(data, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200");

          done();
        });
      });

      it("new resource has changed", function(done) {
        var url = "http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags";
        helpers.request({
        method: "GET",
        url: url
      }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200");

          assert.deepEqual(json.data, [
            {
              "type": "tags",
              "id": "6ec62f6d-9f82-40c5-b4f4-279ed1765492"
            }
          ]);

          done();
        });
      });
    });

    describe("deleting", function() {
      it("deletes the resource on one()", function(done) {
        var data = {
          method: "delete",
          url: "http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags",
          headers: {
            "Content-Type": "application/vnd.api+json"
          },
          body: JSON.stringify({
            "data": { "type": "tags", "id": "6ec62f6d-9f82-40c5-b4f4-279ed1765492" }
          })
        };
        helpers.request(data, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200");

          done();
        });
      });

      it("new resource has changed", function(done) {
        var url = "http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags";
        helpers.request({
        method: "GET",
        url: url
      }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200");
          assert.deepEqual(json.data, [ ]);

          done();
        });
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
