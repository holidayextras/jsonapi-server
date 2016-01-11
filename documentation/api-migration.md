
### Migrating towards jsonapi-server from ExpressJS

If you've got an existing API powered by ExpressJS and you want to migrate towards using json:api, you're in the right place. The migration process we're running with is to:

1. Get jsonapi-server running alongside an existing express app using a path prefix.
2. Define some new resources using the in-memory handlers.
3. Lock in the resource definitions and develop custom handlers to provide data in the new formats by re-using existing functionality in the current codebase.
4. Migrate traffic over to the json:api resources.
5. Kill off the old express server.

We're using something similar to the below snippet to run jsonapi-server alongside our existing express application:

```javascript
// BEFORE you run this function you should bring up your expressJs
// server as usual, bind your routes, etc etc.
// Do NOT require() jsonapi-server, this function does it for you!
// Execute this function with an existing express() instance:
var bootstrapJsonApi = function(expressApp) {
  // Find the express module in the NodeJS internal cache
  var express = Object.keys(require.cache).filter(function(i) {
    return i.match('/node_modules/express/index.js');
  }).pop();
  // Alter the expressJs constructor to return your existing instance
  // preventing jsonapi-server from trying to build a new one
  require.cache[express].exports = function() {
    return expressApp;
  };
  // Now load jsonapi-server, which will require express and call The
  // constructor, which now returns your existing express instance
  jsonApi = require('jsonapi-server');
  // Finally make this function call to register the json:api routes
  require('jsonapi-server/lib/routes/index.js').register();

  // Now define your resources as usual.
  // DO NOT call jsonApi.start() !!
};
```
