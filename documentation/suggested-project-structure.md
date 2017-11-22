### Suggested Project Structure

 * `server.js` is the main entry point.
 * Think of the `resources` folder as your `routes`.
 * Think of the `handlers` folder as your `controllers`.

```
├── handlers
│   ├── articleHandler.js
│   ├── commentHandler.js
│   ├── peopleHandler.js
│   ├── photoHandler.js
│   └── tagHandler.js
├── resources
│   ├── articles.js
│   ├── comments.js
│   ├── people.js
│   ├── photos.js
│   └── tags.js
└── server.js          
```

#### Example server.js

This is the main entry point for your API. The goal is to configure jsonapi-server and load all the resources.

```javascript
var jsonApi = require("jsonapi-server");
var fs = require("fs");
var path = require("path");

jsonApi.setConfig({
  // Put your config here!
});

// Load all the resources
fs.readdirSync(path.join(__dirname, "/resources")).filter(function(filename) {
  return /^[a-z].*\.js$/.test(filename);
}).map(function(filename) {
  return path.join(__dirname, "/resources/", filename);
}).forEach(require);

jsonApi.start();
```

#### Example resource

The idea is to stick to having one resource per file and stick to pure config. Each file should do nothing more than define a resource. Handlers should be referenced from the `../handlers` folder, which enables us to easily abstract functionality by sharing features amongst handlers. Resource files are effectively defining your routing layer.

```javascript
var photosHandler = require("../handlers/photosHandler.js");

jsonApi.define({
  resource: "photos",
  handlers: photosHandler,
  attributes: {
    title: jsonApi.Joi.string(),
    url: jsonApi.Joi.string().uri(),
    height: jsonApi.Joi.number().min(1).max(10000).precision(0),
    width: jsonApi.Joi.number().min(1).max(10000).precision(0)
  }
});
```

#### Example handler

Handlers are like your controllers - they need to, at very least, provide the functionality described in the [handler documentation](handlers.md). The following example covers how you implement [jsonapi-store-elasticsearch](https://github.com/holidayextras/jsonapi-store-elasticsearch).

```javascript
var EsHandler = require("jsonapi-store-elasticsearch");

// You might want to pull this out further to share it
// amongst other handlers
var specificEsCluster = var new EsHandler({
  host: "localhost:9200"
});

module.exports = specificEsCluster;

// // If you want to intercept calls to extend existing behaviour:
//
// var baseCreate = specificEsCluster.create;
// specificEsCluster.create = function(request, newResource, callback) {
//   // tweak something?
//   baseCreate.call(specificEsCluster, request, newResource, function(err, result) {
//     // tweak something else?
//     return callback(err, result);
//   });
// };

// // If you want to partially override behaviour to
// // provide a more efficient solution:
//
// efficientHandler.search = function(request, callback) {
//   // do your own thing, invoke the callback when done
// };
```
