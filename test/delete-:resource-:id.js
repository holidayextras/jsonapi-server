"use strict";
var request = require("request");
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApiTestServer = require("../example/server.js");


describe("Testing jsonapi-server", function() {
  describe("Deleting a resource", function() {
    it("errors with invalid type", function(done) {
      var data = {
        method: "delete",
        url: "http://localhost:16006/rest/foobar/someId"
      };
      request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "404", "Expecting 404");

        done();
      });
    });

    it("errors with invalid id", function(done) {
      var data = {
        method: "delete",
        url: "http://localhost:16006/rest/comments/foobar"
      };
      request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "404", "Expecting 404");

        done();
      });
    });

    describe("deleting a comment", function() {
      it("deletes the resource", function(done) {
        var data = {
          method: "delete",
          url: "http://localhost:16006/rest/comments/6b017640-827c-4d50-8dcc-79d766abb408"
        };
        request(data, function(err, res, json) {
          assert.equal(err, null);
          json = JSON.parse(json);
          var keys = Object.keys(json);
          assert.deepEqual(keys, [ "meta" ], "Should only have a meta block");
          assert.equal(res.statusCode, "200", "Expecting 200");

          done();
        });
      });

      it("new resource is gone", function(done) {
        var url = "http://localhost:16006/rest/comments/6b017640-827c-4d50-8dcc-79d766abb408";
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
    });
  });

  before(function() {
    jsonApiTestServer.start();
  });
  after(function() {
    jsonApiTestServer.close();
  });
});
