"use strict";
var assert = require("assert");
var helpers = require("./helpers.js");
var request = require("request");
var jsonApiTestServer = require("../example/server.js");


describe("Testing jsonapi-server", function() {
  describe("Finding a specific resource", function() {
    it("unknown id should error", function(done) {
      var url = "http://localhost:16006/rest/articles/foobar";
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

    it("valid lookup", function(done) {
      var url = "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014";
      helpers.request({
        method: "GET",
        url: url
      }, function(err, res, json) {
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
      request({
        method: "GET",
        url: url
      }, function(err, res, json) {
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
      helpers.request({
        method: "GET",
        url: url
      }, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateJson(json);

        assert.equal(res.statusCode, "200", "Expecting 200 OK");
        assert.deepEqual(json.data, null);

        done();
      });
    });

    describe("with includes", function() {
      it("basic include", function(done) {
        var url = "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014?include=author";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
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

      it("including over a null relation", function(done) {
        var url = "http://localhost:16006/rest/tags/8d196606-134c-4504-a93a-0d372f78d6c5?include=parent";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          assert.equal(json.included.length, 0, "Should be 0 included resources");
          done();
        });
      });
    });

    describe("with recursive includes", function() {
      it("works with a manually expanded string", function(done) {
        var url = "http://localhost:16006/rest/tags/7541a4de-4986-4597-81b9-cf31b6762486?include=parent.parent.parent.parent.articles";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          assert.equal(json.included.length, 5, "Should be 5 included resources");
          assert.equal(json.included[4].type, "articles", "Last include should be an article");
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
