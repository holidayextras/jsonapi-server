"use strict";
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApiTestServer = require("../example/server.js");


describe("Testing jsonapi-server", function() {
  describe("Searching for resources", function() {
    it("unknown resource should error", function(done) {
      var url = "http://localhost:16006/rest/foobar";
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

    it("empty search should return all objects", function(done) {
      var url = "http://localhost:16006/rest/articles";
      helpers.request({
        method: "GET",
        url: url
      }, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateJson(json);

        assert.equal(res.statusCode, "200", "Expecting 200 OK");
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
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
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
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
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
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateError(json);
          assert.equal(res.statusCode, "403", "Expecting 403");
          done();
        });
      });

      it("less than", function(done) {
        var url = "http://localhost:16006/rest/articles?filter[title]=<M";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          var titles = json.data.map(function(i) { return i.attributes.title; });
          titles.sort();
          assert.deepEqual(titles, [ "How to AWS", "Linux Rocks" ], "expected matching resources");

          done();
        });
      });

      it("greater than", function(done) {
        var url = "http://localhost:16006/rest/articles?filter[title]=>M";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          var titles = json.data.map(function(i) { return i.attributes.title; });
          titles.sort();
          assert.deepEqual(titles, [ "NodeJS Best Practices", "Tea for Beginners" ], "expected matching resources");

          done();
        });
      });

      it("case insensitive", function(done) {
        var url = "http://localhost:16006/rest/articles?filter[title]=~linux rocks";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
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
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          var titles = json.data.map(function(i) { return i.attributes.title; });
          assert.deepEqual(titles, [ "Tea for Beginners" ], "expected matching resources");

          done();
        });
      });

      it("allows filtering by id", function(done) {
        var url = "http://localhost:16006/rest/articles?filter[id]=1be0913c-3c25-4261-98f1-e41174025ed5,de305d54-75b4-431b-adb2-eb6b9e546014";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          assert.equal(json.data.length, 2, "Should only give the 2x requested resources");

          done();
        });
      });
    });

    describe("applying fields", function() {
      it("unknown attribute should error", function(done) {
        var url = "http://localhost:16006/rest/articles?fields[article]=title";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateError(json);
          assert.equal(res.statusCode, "403", "Expecting 403");
          done();
        });
      });

      it("just title", function(done) {
        var url = "http://localhost:16006/rest/articles?fields[articles]=title";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
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
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
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
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateError(json);
          assert.equal(res.statusCode, "403", "Expecting 403");
          done();
        });
      });

      it("include author", function(done) {
        var url = "http://localhost:16006/rest/articles?include=author";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
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
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
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
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
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
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
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
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
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

    describe("by foreign key", function() {

      it("should find resources by relation", function(done) {
        var url = "http://localhost:16006/rest/articles/?relationships[photos]=aab14844-97e7-401c-98c8-0bd5ec922d93";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200 OK");
          assert.equal(json.data.length, 2, "Should be 2 matching resources");
          done();
        });
      });

      it("should error with incorrectly named relations", function(done) {
        var url = "http://localhost:16006/rest/articles/?relationships[photo]=aab14844-97e7-401c-98c8-0bd5ec922d93";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateError(json);

          assert.equal(res.statusCode, "403", "Expecting 403 EFORBIDDEN");
          done();
        });
      });

      it("should error when queriying with non-relation attributes", function(done) {
        var url = "http://localhost:16006/rest/articles/?relationships[content]=aab14844-97e7-401c-98c8-0bd5ec922d93";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateError(json);

          assert.equal(res.statusCode, "403", "Expecting 403 EFORBIDDEN");
          done();
        });
      });

      it("should error when querying the foreign end of a relationship", function(done) {
        var url = "http://localhost:16006/rest/comments/?relationships[article]=aab14844-97e7-401c-98c8-0bd5ec922d93";
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateError(json);

          assert.equal(res.statusCode, "403", "Expecting 403 EFORBIDDEN");
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
