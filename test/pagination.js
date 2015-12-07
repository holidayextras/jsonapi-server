"use strict";
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApiTestServer = require("../example/server.js");

var pageLinks;

describe("Testing jsonapi-server", function() {
  describe("pagination", function() {
    it("errors with invalid page parameters", function(done) {
      var data = {
        method: "get",
        url: "http://localhost:16006/rest/articles?page[size]=10"
      };
      helpers.request(data, function(err, res) {
        assert.equal(err, null);
        assert.equal(res.statusCode, "403", "Expecting 403");

        done();
      });
    });

    describe("clicks through a full result set", function() {
      it("fetches the first page", function(done) {
        var data = {
          method: "get",
          url: "http://localhost:16006/rest/articles?page[offset]=0&page[limit]=1&sort=title"
        };
        helpers.request(data, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200");
          assert.equal(json.meta.page.offset, 0, "should be at offset 0");
          assert.equal(json.meta.page.limit, 1, "should have a limit of 1 record");
          assert.equal(json.meta.page.total, 4, "should have a total of 4 records");

          assert.equal(json.data[0].attributes.title, "How to AWS", "should be on the first article");

          assert.ok(Object.keys(json.links).length, 3, "should have 3x links");
          assert.ok(json.links.last.match(/page%5Boffset%5D=3&page%5Blimit%5D=1/), "last should target offset-3 limit-1");
          assert.ok(json.links.next.match(/page%5Boffset%5D=1&page%5Blimit%5D=1/), "next should target offset-1 limit-1");

          pageLinks = json.links;
          done();
        });
      });

      it("fetches the second page", function(done) {
        var data = {
          method: "get",
          url: pageLinks.next
        };
        helpers.request(data, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200");
          assert.equal(json.meta.page.offset, 1, "should be at offset 0");
          assert.equal(json.meta.page.limit, 1, "should have a limit of 1 record");
          assert.equal(json.meta.page.total, 4, "should have a total of 4 records");

          assert.equal(json.data[0].attributes.title, "Linux Rocks", "should be on the second article");

          assert.ok(Object.keys(json.links).length, 5, "should have 5x links");
          assert.ok(json.links.first.match(/page%5Boffset%5D=0&page%5Blimit%5D=1/), "first should target offset-0 limit-1");
          assert.ok(json.links.last.match(/page%5Boffset%5D=3&page%5Blimit%5D=1/), "last should target offset-3 limit-1");
          assert.ok(json.links.next.match(/page%5Boffset%5D=2&page%5Blimit%5D=1/), "next should target offset-2 limit-1");
          assert.ok(json.links.prev.match(/page%5Boffset%5D=0&page%5Blimit%5D=1/), "prev should target offset-0 limit-1");

          pageLinks = json.links;
          done();
        });
      });

      it("fetches the third page", function(done) {
        var data = {
          method: "get",
          url: pageLinks.next
        };
        helpers.request(data, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200");
          assert.equal(json.meta.page.offset, 2, "should be at offset 0");
          assert.equal(json.meta.page.limit, 1, "should have a limit of 1 record");
          assert.equal(json.meta.page.total, 4, "should have a total of 4 records");

          assert.equal(json.data[0].attributes.title, "NodeJS Best Practices", "should be on the first article");

          assert.ok(Object.keys(json.links).length, 5, "should have 5x links");
          assert.ok(json.links.first.match(/page%5Boffset%5D=0&page%5Blimit%5D=1/), "first should target offset-0 limit-1");
          assert.ok(json.links.last.match(/page%5Boffset%5D=3&page%5Blimit%5D=1/), "last should target offset-3 limit-1");
          assert.ok(json.links.next.match(/page%5Boffset%5D=3&page%5Blimit%5D=1/), "next should target offset-3 limit-1");
          assert.ok(json.links.prev.match(/page%5Boffset%5D=1&page%5Blimit%5D=1/), "prev should target offset-1 limit-1");

          pageLinks = json.links;
          done();
        });
      });

      it("fetches the final page", function(done) {
        var data = {
          method: "get",
          url: pageLinks.next
        };
        helpers.request(data, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);

          assert.equal(res.statusCode, "200", "Expecting 200");
          assert.equal(json.meta.page.offset, 3, "should be at offset 0");
          assert.equal(json.meta.page.limit, 1, "should have a limit of 1 record");
          assert.equal(json.meta.page.total, 4, "should have a total of 4 records");

          assert.equal(json.data[0].attributes.title, "Tea for Beginners", "should be on the fourth article");

          assert.ok(Object.keys(json.links).length, 3, "should have 3x links");
          assert.ok(json.links.first.match(/page%5Boffset%5D=0&page%5Blimit%5D=1/), "first should target offset-0 limit-1");
          assert.ok(json.links.prev.match(/page%5Boffset%5D=2&page%5Blimit%5D=1/), "prev should target offset-2 limit-1");

          pageLinks = json.links;
          done();
        });
      });
    });

    it("fetches an obscure page", function(done) {
      var data = {
        method: "get",
        url: "http://localhost:16006/rest/articles?page[offset]=1&page[limit]=2&sort=title"
      };
      helpers.request(data, function(err, res, json) {
        assert.equal(err, null);
        json = helpers.validateJson(json);

        assert.equal(res.statusCode, "200", "Expecting 200");
        assert.equal(json.meta.page.offset, 1, "should be at offset 1");
        assert.equal(json.meta.page.limit, 2, "should have a limit of 2 records");
        assert.equal(json.meta.page.total, 4, "should have a total of 4 records");

        assert.equal(json.data[0].attributes.title, "Linux Rocks", "should be on the third article");
        assert.equal(json.data[1].attributes.title, "NodeJS Best Practices", "should be on the third article");

        assert.ok(Object.keys(json.links).length, 5, "should have 5x links");
        assert.ok(json.links.first.match(/page%5Boffset%5D=0&page%5Blimit%5D=2/), "first should target offset-0 limit-2");
        assert.ok(json.links.last.match(/page%5Boffset%5D=3&page%5Blimit%5D=2/), "last should target offset-3 limit-2");
        assert.ok(json.links.next.match(/page%5Boffset%5D=3&page%5Blimit%5D=2/), "next should target offset-3 limit-2");
        assert.ok(json.links.prev.match(/page%5Boffset%5D=0&page%5Blimit%5D=2/), "prev should target offset-0 limit-2");

        pageLinks = json.links;
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
