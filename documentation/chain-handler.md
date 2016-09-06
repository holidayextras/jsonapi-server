
### Chaining handlers together with the ChainHandler


```javascript
"use strict";
var jsonApi = require("../..");
var authenticationHandler = module.exports = new jsonApi.ChainHandler();

authenticationHandler.beforeSearch = function(request, callback) {
  console.log("Before!");
  return callback();
};

authenticationHandler.afterSearch = function(results, pagination, callback) {
  console.log("After!");
  return callback(null, results, pagination);
};
```

```javascript
var authenticationHandler = require('../handlers/authenticationHandler.js');
var memoryHandler = new jsonApi.MemoryHandler();

jsonApi.define({
  resource: "articles",
  handlers: authenticationHandler.chain(memoryHandler),
});
```
