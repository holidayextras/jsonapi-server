
### Configuring jsonapi-server

```
jsonApi.setConfig({
  // Define a url prefix for the apiConfig
  // eg http://-----/rest/
  base: "rest",
  // HTTP port to listen on
  port: 16006,
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

#### Starting jsonapi-server

Note: You should only start the server once all your resources have been declared!

```
jsonApi.start();
```

#### Stopping jsonapi-server

```
jsonApi.close();
```
