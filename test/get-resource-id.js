"use strict";
var request = require("request");
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApiTestServer = require("../example/server.js");


describe("Testing jsonapi-server", function() {
  describe("Finding a specific resource", function() {
    it("unknown id should error", function(done) {
      var url = "http://localhost:16006/rest/articles/foobar";
      request.get(url, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "404", "Expecting 404");
        done();
      });
    });

    it("valid lookup", function(done) {
      var url = "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014";
      request.get(url, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateJson(json);

        assert.equal(res.statusCode, "200", "Expecting 200 OK");
        assert.equal(json.included.length, 0, "Should be no included resources");
        helpers.validateResource(json.data);

        done();
      });
    });

    it("with fields", function(done) {
      var url = "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014?fields[articles]=title";
      request.get(url, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateJson(json);

        assert.equal(res.statusCode, "200", "Expecting 200 OK");
        helpers.validateResource(json.data);
        var keys = Object.keys(json.data.attributes);
        assert.deepEqual(keys, [ "title" ], "Should only contain title attribute");

        done();
      });
    });

    it("with filter", function(done) {
      var url = "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014?filter[title]=title";
      request.get(url, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateJson(json);

        assert.equal(res.statusCode, "200", "Expecting 200 OK");
        assert.deepEqual(json.data, null);

        done();
      });
    });

    it("with includes", function(done) {
      var url = "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014?include=author";
      request.get(url, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateJson(json);

        assert.equal(res.statusCode, "200", "Expecting 200 OK");
        assert.equal(json.included.length, 1, "Should be 1 included resource");

        var people = json.included.filter(function(resource) {
          return resource.type === "people";
        });
        assert.equal(people.length, 1, "Should be 1 included people resource");

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
