"use strict";
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApi = require("../lib/jsonApi");
var jsonApiTestServer = require("../example/server");


describe("Testing jsonapi-server", function() {

  describe("resource readiness", function() {

    it("returns 200 if resource is ready", function(done) {
      var url = "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014";
      helpers.request({
        method: "GET",
        url: url
      }, function(err, res) {
        assert(!err);
        assert.strictEqual(res.statusCode, 200, "Expecting 200 OK");
        done();
      });
    });

    it("returns 503 if resource is NOT ready", function(done) {
      var handlers = jsonApi._resources.articles.handlers;
      var savedHandlersReady = handlers.ready;
      handlers.ready = false;
      var url = "http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014";
      helpers.request({
        method: "GET",
        url: url
      }, function(err, res) {
        assert(!err);
        assert.strictEqual(res.statusCode, 503, "Expecting 503 SERVICE UNAVAILABLE");
        handlers.ready = savedHandlersReady;
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
