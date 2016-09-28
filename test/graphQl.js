"use strict";
var assert = require("assert");
var jsonApiTestServer = require("../example/server");

var Lokka = require('lokka').Lokka;
var Transport = require('lokka-transport-http').Transport;
var client = new Lokka({
  transport: new Transport('http://localhost:16006/rest/')
});


describe("Testing jsonapi-server graphql", function() {

  describe("read operations", function() {

    it("filter with primary join and filter", function() {
      return client.query(`
        {
          photos(width: "<1000") {
            url
            width
            photographer(firstname: "Rahul") {
              firstname
            }
          }
        }
      `).then(function(result) {
        assert.deepEqual(result, {
          "photos": [
            {
              "url": "http://www.example.com/penguins",
              "width": 60,
              "photographer": null
            },
            {
              "url": "http://www.example.com/treat",
              "width": 350,
              "photographer": {
                "firstname": "Rahul"
              }
            }
          ]
        });
      });
    });

    it("filter with foreign join and filter", function() {
      return client.query(`
        {
          people(firstname: "Rahul") {
            firstname
            photos(width: "<1000") {
              url
              width
            }
          }
        }
      `).then(function(result) {
        assert.deepEqual(result, {
          "people": [
            {
              "firstname": "Rahul",
              "photos": [
                {
                  "url": "http://www.example.com/treat",
                  "width": 350
                }
              ]
            }
          ]
        });
      });
    });

  });

  describe("write operations", function() {
    var tagId = null;

    it("create a tag", function() {
      return client.mutate(`
        {
          createTags(tags: {
            name: "test1"
            parent: {
              id: "7541a4de-4986-4597-81b9-cf31b6762486"
            }
          }) {
            id
            name
            parent {
              id
              name
            }
          }
        }
      `).then(function(result) {
        assert.equal(result.createTags.name, "test1");
        assert.equal(result.createTags.parent.id, "7541a4de-4986-4597-81b9-cf31b6762486");
        assert.equal(result.createTags.parent.name, "live");
        tagId = result.createTags.id;
      });
    });

    it("update the new tag", function() {
      return client.mutate(`
        {
          updateTags(tags: {
            id: "${tagId}"
            name: "test2"
            parent: {
              id: "68538177-7a62-4752-bc4e-8f971d253b42"
            }
          }) {
            id
            name
            parent {
              id
              name
            }
          }
        }
      `).then(function(result) {
        assert.deepEqual(result, {
          updateTags: {
            id: tagId,
            name: "test2",
            parent: {
              id: "68538177-7a62-4752-bc4e-8f971d253b42",
              name: "development"
            }
          }
        })
      });
    });

    it("deletes the tag", function() {
      return client.mutate(`
        {
          deleteTags(id: "${tagId}") {
            name
          }
        }
      `).then(function(result) {
        assert.deepEqual(result, {
          "deleteTags": {
            "name": "test2"
          }
        });
      });
    });

    it("really is gone", function() {
      return client.query(`
        {
          tags(id: "${tagId}") {
            name
          }
        }
      `).then(function(result) {
        assert.deepEqual(result, {
          "tags": [ ]
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
