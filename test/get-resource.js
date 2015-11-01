"use strict";
var request = require("request");
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApiTestServer = require("../example/server.js");


describe("Testing jsonapi-server", function() {
  describe("Searching for resources", function() {
    it("unknown resource should error", function(done) {
      var url = "http://localhost:16006/rest/foobar";
      request.get(url, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateError(json);
        assert.equal(res.statusCode, "404", "Expecting 404");
        done();
      });
    });

    it("empty search should return all objects", function(done) {
      var url = "http://localhost:16006/rest/articles";
      request.get(url, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateJson(json);

        assert.equal(res.statusCode, "200", "Expecting 200 OK");
        var keys = Object.keys(json);
        assert.deepEqual(keys, [ "meta", "links", "data", "included" ], "Response should have specific properties");
        assert.deepEqual(json.included, [ ], "Response should have no included resources");
        assert.equal(json.data.length, 4, "Response should contain exactly 4 resources");
        json.data.forEach(function(resource) {
          helpers.validateArticle(resource);
        });

        done();
      });
    });

    describe("applying sort", function() {
      it("ASC sort", function(done) {
        var url = "http://localhost:16006/rest/articles?sort=title";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          assert.equal(json.data.length, 4, "Response should contain exactly 4 resources");

          var previous = json.data[0];
          var current;
          for (var i = 1; i < json.data.length; i++) {
            current = json.data[i];
            assert.ok(previous.attributes.title < current.attributes.title, "Resources should be ordered");
          }

          done();
        });
      });

      it("DESC sort", function(done) {
        var url = "http://localhost:16006/rest/articles?sort=-title";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          assert.equal(json.data.length, 4, "Response should contain exactly 4 resources");

          var previous = json.data[0];
          var current;
          for (var i = 1; i < json.data.length; i++) {
            current = json.data[i];
            assert.ok(previous.attributes.title > current.attributes.title, "Resources should be ordered");
          }

          done();
        });
      });
    });

    describe("applying filter", function() {
      it("unknown attribute should error", function(done) {
        var url = "http://localhost:16006/rest/articles?filter[foobar]=<M";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateError(json);
          assert.equal(res.statusCode, "403", "Expecting 403");
          done();
        });
      });

      it("less than", function(done) {
        var url = "http://localhost:16006/rest/articles?filter[title]=<M";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          var titles = json.data.map(function(i) { return i.attributes.title; });
          assert.deepEqual(titles, [ "Linux Rocks", "How to AWS" ], "expected matching resources");

          done();
        });
      });

      it("greater than", function(done) {
        var url = "http://localhost:16006/rest/articles?filter[title]=>M";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          var titles = json.data.map(function(i) { return i.attributes.title; });
          assert.deepEqual(titles, [ "NodeJS Best Practices", "Tea for Beginners" ], "expected matching resources");

          done();
        });
      });

      it("case insensitive", function(done) {
        var url = "http://localhost:16006/rest/articles?filter[title]=~linux rocks";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          var titles = json.data.map(function(i) { return i.attributes.title; });
          assert.deepEqual(titles, [ "Linux Rocks" ], "expected matching resources");

          done();
        });
      });

      it("similar to", function(done) {
        var url = "http://localhost:16006/rest/articles?filter[title]=:for";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          var titles = json.data.map(function(i) { return i.attributes.title; });
          assert.deepEqual(titles, [ "Tea for Beginners" ], "expected matching resources");

          done();
        });
      });
    });

    describe("applying fields", function() {
      it("unknown attribute should error", function(done) {
        var url = "http://localhost:16006/rest/articles?fields[article]=title";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateError(json);
          assert.equal(res.statusCode, "403", "Expecting 403");
          done();
        });
      });

      it("just title", function(done) {
        var url = "http://localhost:16006/rest/articles?fields[articles]=title";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          json.data.forEach(function(resource) {
            var keys = Object.keys(resource.attributes);
            assert.deepEqual(keys, [ "title" ], "should only have the title attribute");
          });

          done();
        });
      });

      it("title AND content", function(done) {
        var url = "http://localhost:16006/rest/articles?fields[articles]=title,content";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          json.data.forEach(function(resource) {
            var keys = Object.keys(resource.attributes);
            assert.deepEqual(keys, [ "title", "content" ], "should only have the title attribute");
          });

          done();
        });
      });
    });

    describe("applying includes", function() {
      it("unknown attribute should error", function(done) {
        var url = "http://localhost:16006/rest/articles?include=foobar";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateError(json);
          assert.equal(res.statusCode, "403", "Expecting 403");
          done();
        });
      });

      it("include author", function(done) {
        var url = "http://localhost:16006/rest/articles?include=author";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          assert.equal(json.included.length, 4, "Should be 4 included resources");

          var people = json.included.filter(function(resource) {
            return resource.type === "people";
          });
          assert.equal(people.length, 4, "Should be 4 included people resources");

          done();
        });
      });

      it("include author and photos", function(done) {
        var url = "http://localhost:16006/rest/articles?include=author,photos";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          assert.equal(json.included.length, 7, "Should be 7 included resources");

          var people = json.included.filter(function(resource) {
            return resource.type === "people";
          });
          assert.equal(people.length, 4, "Should be 4 included people resources");

          var photos = json.included.filter(function(resource) {
            return resource.type === "photos";
          });
          assert.equal(photos.length, 3, "Should be 3 included photos resources");

          done();
        });
      });

      it("include author.photos and photos", function(done) {
        var url = "http://localhost:16006/rest/articles?include=author.photos,photos";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          assert.equal(json.included.length, 7, "Should be 7 included resources");

          var people = json.included.filter(function(resource) {
            return resource.type === "people";
          });
          assert.equal(people.length, 4, "Should be 4 included people resources");

          var photos = json.included.filter(function(resource) {
            return resource.type === "photos";
          });
          assert.equal(photos.length, 3, "Should be 3 included photos resources");

          done();
        });
      });

      it("include author.photos", function(done) {
        var url = "http://localhost:16006/rest/articles?include=author.photos";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          assert.equal(json.included.length, 7, "Should be 7 included resources");

          var people = json.included.filter(function(resource) {
            return resource.type === "people";
          });
          assert.equal(people.length, 4, "Should be 4 included people resources");

          var photos = json.included.filter(function(resource) {
            return resource.type === "photos";
          });
          assert.equal(photos.length, 3, "Should be 3 included photos resources");

          done();
        });
      });

      it("include author.photos with filter", function(done) {
        var url = "http://localhost:16006/rest/articles?include=author.photos&filter[author][firstname]=Mark";
        request.get(url, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          assert.equal(json.included.length, 2, "Should be 2 included resources");

          var people = json.included.filter(function(resource) {
            return resource.type === "people";
          });
          assert.equal(people.length, 1, "Should be 1 included people resource");

          var photos = json.included.filter(function(resource) {
            return resource.type === "photos";
          });
          assert.equal(photos.length, 1, "Should be 1 included photos resource");

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
