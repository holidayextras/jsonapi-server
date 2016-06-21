"use strict";
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApiTestServer = require("../example/server.js");


describe("Testing jsonapi-server", function() {
  describe("Adding to a relation", function() {
    it("errors with invalid type", function(done) {
      var data = {
        method: "post",
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
        method: "post",
        url: "http://localhost:16006/rest/articles/foobar/relationships/author",
        headers: {
          "Content-Type": "application/vnd.api+json"
        },
        body: JSON.stringify({
          "data": { "type": "people", "id": "ad3aa89e-9c5b-4ac9-a652-6670f9f27587" }
        })
      };
      helpers.request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "404", "Expecting 404");

        done();
      });
    });

    it("errors with invalid type", function(done) {
      var data = {
        method: "post",
        url: "http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/comments",
        headers: {
          "Content-Type": "application/vnd.api+json"
        },
        body: JSON.stringify({
          "data": { "type": "people", "id": "6b017640-827c-4d50-8dcc-79d766abb408" }
        })
      };
      helpers.request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "403", "Expecting 403");

        done();
      });
    });

    describe("adding to a many()", function() {
      it("updates the resource", function(done) {
        var data = {
          method: "post",
          url: "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/relationships/comments",
          headers: {
            "Content-Type": "application/vnd.api+json"
          },
          body: JSON.stringify({
            "data": { "type": "comments", "id": "6b017640-827c-4d50-8dcc-79d766abb408", meta: { "updated": "2016-01-01" } }
          })
        };
        helpers.request(data, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "201", "Expecting 201");

          done();
        });
      });

      it("new resource has changed", function(done) {
        var url = "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/relationships/comments";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200");

          assert.deepEqual(json.data, [
            {
              "type": "comments",
              "id": "3f1a89c2-eb85-4799-a048-6735db24b7eb"
            },
            {
              "type": "comments",
              "id": "6b017640-827c-4d50-8dcc-79d766abb408",
              "meta": {
                "updated": "2016-01-01"
              }
            }
          ]);

          done();
        });
      });
    });

    describe("adding to a one()", function() {
      it("updates the resource", function(done) {
        var data = {
          method: "post",
          url: "http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/author",
          headers: {
            "Content-Type": "application/vnd.api+json"
          },
          body: JSON.stringify({
            "data": { "type": "people", "id": "cc5cca2e-0dd8-4b95-8cfc-a11230e73116" }
          })
        };
        helpers.request(data, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "201", "Expecting 201");

          done();
        });
      });

      it("new resource has changed", function(done) {
        var url = "http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/author";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200");

          assert.deepEqual(json.data, {
            "type": "people",
            "id": "cc5cca2e-0dd8-4b95-8cfc-a11230e73116"
          });

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
