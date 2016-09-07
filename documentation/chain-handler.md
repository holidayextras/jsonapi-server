
### Chaining handlers together with the ChainHandler

This project ships with a handler called the `ChainHandler`. It's purpose is to make it easier to wrap the functionality of one handler with additional functionality. For example using the relational data store may be ideal for storing resources, but what if we want to add an authentication layer on top of those resources? An authentication handler shouldn't know or care about the storage of the underlying resource, it should only deal with authentication - we need an abstraction layer to help us glue all of this together. 

To get started with the ChainHandler, go ahead and instantiate one:
```javascript
var jsonApi = require("jsonapi-server");
var testChainHandler = new jsonApi.ChainHandler();
```
From there it's a simple case of attaching new function handlers to `testChainHandler`, following the naming convention of `("before"|"after")+function` - eg `beforeSearch`, `beforeCreate`, `afterDelete`.

These new functions need to match the signatures of the functions they're overriding and need to pass the data onwards via a callback. For example, here are two valid functions that don't add any functionality. Notice how the callback values match the function signatures:
```
testChainHandler.beforeSearch = function(request, callback) {
  return callback(null, request);
};

testChainHandler.afterSearch = function(results, pagination, callback) {
  return callback(null, results, pagination);
};
```

With a new ChainHandler ready to go, this is how we can stack them up:
```javascript
jsonApi.define({
  resource: "articles",
  handlers: chainHandler1.chain(chainHandler2).chain(memoryHandler),
});
```

The call stack when chaining multiple `ChainHandler`s together looks like this:
```
chainHandler1.beforeSearch
  chainHandler2.beforeSearch
    MemoryHandler.search
  chainHandler2.afterSearch
chainHandler1.afterSearch
```
