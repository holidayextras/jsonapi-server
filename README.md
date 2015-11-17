[![Coverage Status](https://coveralls.io/repos/holidayextras/jsonapi-server/badge.svg?branch=master)](https://coveralls.io/r/holidayextras/jsonapi-server?branch=master)
[![Build Status](https://travis-ci.org/holidayextras/jsonapi-server.svg?branch=master)](https://travis-ci.org/holidayextras/jsonapi-server)
[![npm version](https://badge.fury.io/js/jsonapi-server.svg)](http://badge.fury.io/js/jsonapi-server)
[![Code Climate](https://codeclimate.com/github/holidayextras/jsonapi-server/badges/gpa.svg)](https://codeclimate.com/github/holidayextras/jsonapi-server)
[![Dependencies Status](https://david-dm.org/holidayextras/jsonapi-server.svg)](https://david-dm.org/holidayextras/jsonapi-server)

# jsonapi-server

`jsonapi-server` is a fully featured NodeJS server implementation of `json:api`. You provide the resources, we provide the api.

### Full documentation

- [Configuring jsonapi-server](documentation/configuring.md)
- [Defining Resources](documentation/resources.md)
- [Foreign Key Relations](documentation/foreign-relations.md)
- [Creating Handlers](documentation/handlers.md)
- [Post Processing Examples](documentation/post-processing.md)

### The tl;dr

You can have a complete json:api server providing a `photos` resource with just this:
```javascript
var jsonApi = require("jsonapi-server");

jsonApi.setConfig({
  base: "rest",
  port: 16006,
});

jsonApi.define({
  resource: "photos",
  handlers: new jsonApi.MockHandler(),
  attributes: {
    title: jsonApi.Joi.string()
    url: jsonApi.Joi.string().uri()
    height: jsonApi.Joi.number().min(1).max(10000).precision(0)
    width: jsonApi.Joi.number().min(1).max(10000).precision(0)
  }
});

jsonApi.start();
```
Your new API will be alive at `http://localhost:16006/rest/` and your `photos` resources will be at `http://localhost:16006/rest/photos`.

### Show me an full example!

Fire up an example `json:api` server using the resources mentioned in the official spec via:
```
git clone https://github.com/holidayextras/jsonapi-server.git
npm install
npm start
```
then browse to
```
http://localhost:16006/rest/photos
```
the example implementation can be found [here](example)
