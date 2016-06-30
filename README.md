[![Coverage Status](https://coveralls.io/repos/holidayextras/jsonapi-server/badge.svg?branch=master)](https://coveralls.io/r/holidayextras/jsonapi-server?branch=master)
[![Build Status](https://travis-ci.org/holidayextras/jsonapi-server.svg?branch=master)](https://travis-ci.org/holidayextras/jsonapi-server)
[![npm version](https://badge.fury.io/js/jsonapi-server.svg)](http://badge.fury.io/js/jsonapi-server)
[![Code Climate](https://codeclimate.com/github/holidayextras/jsonapi-server/badges/gpa.svg)](https://codeclimate.com/github/holidayextras/jsonapi-server)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/dd604d6548d8467caa224f078d59b182)](https://www.codacy.com/app/oliver-rumbelow/jsonapi-server)
[![Dependencies Status](https://david-dm.org/holidayextras/jsonapi-server.svg)](https://david-dm.org/holidayextras/jsonapi-server)

# jsonapi-server

A config driven NodeJS framework implementing [`json:api`](http://jsonapi.org/). You define the resources, it provides the api.

### Motivation / Justification / Rationale

This framework solves the challenge of json:api without coupling us to any one ORM solution. Every other module out there is either tightly coupled to a database implementation, tracking an old version of the json:api spec, or is merely a helper library for a small feature. If you're building an API and your use case only involves reading and writing to a data store... well count yourself lucky. For everyone else, this framework provides the flexibility to provide a complex API without being confined to any one technology.

A config driven approach to building an API enables:
 * Enforced json:api responses
 * Request validation
 * Payload validation
 * Automatic documentation generation
 * Automatic inclusions
 * Automatic routing
 * Automatic handling of relationships

Ultimately, the only things you as a user of this framework need to care about are:
 * What are my resources called
 * What properties do my resources have
 * For each resource, implement a `handler` for:
   * `create`ing a resource
   * `delete`ing a resource
   * `search`ing for many resources
   * `find`ing a specific resource
   * `update`ing a specific resource

We've created `handler`s to automatically map our config over to database solutions help people get off the ground:
 * [jsonapi-store-memoryhandler](https://github.com/holidayextras/jsonapi-server/blob/master/lib/MemoryHandler.js) - an in-memory data store to enable rapid prototyping. This ships as a part of `jsonapi-server` and powers the core test suite.
 * [jsonapi-store-relationaldb](https://github.com/holidayextras/jsonapi-store-relationaldb) - using `sequelize` to support PostgreSQL, MySQL, MSSQL, MariaDB and SQLite.
 * [jsonapi-store-mongodb](https://github.com/holidayextras/jsonapi-store-mongodb) - for MongoDB.
 * [jsonapi-store-elasticsearch](https://github.com/holidayextras/jsonapi-store-elasticsearch) - for Elasticsearch.
 * [jsonapi-store-dynamodb](https://github.com/holidayextras/jsonapi-server/compare/dynamodb?expand=1) - *!SIGNIFICANT WIP!* for AWS DynamoDB.

We've also written a library to ease the consumption of a json:api compliant service:
 * [jsonapi-client](https://github.com/holidayextras/jsonapi-client) - for NodeJS and Browsers


### Full documentation

- [Suggested Project Structure](documentation/suggested-project-structure.md)
- [Configuring jsonapi-server](documentation/configuring.md)
- [Automatic Swagger Generation](documentation/swagger.md)
- [Defining Resources](documentation/resources.md)
- [Debugging](documentation/debugging.md)
- [Foreign Key Relations](documentation/foreign-relations.md)
- [Custom Handlers](documentation/handlers.md)
- [Post Processing Examples](documentation/post-processing.md)
- [Migrating from an existing express server](documentation/api-migration.md)
- [Application metrics](documentation/metrics.md)

### The tl;dr

You can have a complete json:api server providing a `photos` resource with just this:
```javascript
var jsonApi = require("jsonapi-server");

jsonApi.setConfig({
  port: 16006,
});

jsonApi.define({
  resource: "photos",
  handlers: new jsonApi.MemoryHandler(),
  attributes: {
    title: jsonApi.Joi.string(),
    url: jsonApi.Joi.string().uri(),
    height: jsonApi.Joi.number().min(1).max(10000).precision(0),
    width: jsonApi.Joi.number().min(1).max(10000).precision(0)
  }
});

jsonApi.start();
```
Your new API will be alive at `http://localhost:16006/` and your `photos` resources will be at `http://localhost:16006/photos`.

### Show me a full example!

Fire up an example `json:api` server using the resources mentioned in the official spec via:
```
$ git clone https://github.com/holidayextras/jsonapi-server.git
$ npm install
$ npm start
```
then browse to
```
http://localhost:16006/rest/photos
```
the example implementation can be found [here](example)
