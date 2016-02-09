"use strict";
var assert = require("assert");
var helpers = require("./helpers.js");
var jsonApiTestServer = require("../example/server.js");


describe("Testing jsonapi-server", function() {

  [ { name: "articles", count: 4 },
    { name: "comments", count: 3 },
    { name: "people", count: 4 },
    { name: "photos", count: 3 },
    { name: "tags", count: 5 }
  ].forEach(function(resource) {
    describe("Searching for " + resource.name, function() {
      it("should find " + resource.count, function(done) {
        var url = "http://localhost:16006/rest/" + resource.name;
        helpers.request({
          method: "GET",
          url: url
        }, function(err, res, json) {
          assert.equal(err, null);
          json = helpers.validateJson(json);
          assert.equal(json.data.length, resource.count, "Expected " + resource.count + " resources");
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
