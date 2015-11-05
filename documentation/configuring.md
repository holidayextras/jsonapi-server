
### Configuring jsonapi-server

```
jsonApi.setConfig({
  // HTTP / HTTPS
  protocol: "http",
  // The hostname the API will be sat behind, from the customer's perspective
  hostname: "localhost",
  // The port the customer will be using (OPTIONAL)
  port: 16006,
  // Define a url prefix for the apiConfig
  // eg http://-----/rest/
  base: "rest",
  // meta block to appear in the root of every response
  meta: {
    copyright: "Blah"
  }
});
```

#### Error Handling

```
jsonApi.onUncaughtException(function(request, error) {
  // log the error somewhere
});
```

#### Basic Authentication

```
// This function will be invoked on every request, as soon as the HTTP
// request has been parsed into a "request" object.
jsonApi.authenticate(function(request, callback) {
  // If you callback with an error, the client will receive a HTTP 401 Unauthorised
  if (request.headers.blockme) return callback("Fail");

  // If you callback with no error, the request will continue onwards
  return callback();
});
```

#### Starting jsonapi-server

Note: You should only start the server once all your resources have been declared!

```
jsonApi.start();
```

#### Stopping jsonapi-server

```
jsonApi.close();
```
