
### Configuring jsonapi-server

```javascript
jsonApi.setConfig({
  // (optional) HTTP / HTTPS
  protocol: "http",
  // (optional) The hostname the API will be sat behind, from the customer's perspective
  hostname: "localhost",
  // (required) The port the customer will be using (OPTIONAL)
  port: 16006,
  // (optional) Define a url prefix for the apiConfig
  // eg http://-----/rest/
  base: "rest",
  // (optional) meta block to appear in the root of every response
  meta: {
    copyright: "Blah"
  }
});
```

#### Configuring HTTPS

To run over HTTPS, set the protocol to _https_ and configure the appropriate TLS settings

For example:

```javascript
var fs = require("fs");
jsonApi.setConfig({
  protocol: "https",
  port: 16006,
  tls: {
    cert: fs.readFileSync('server.crt'),
    key: fs.readFileSync('server.key')
    passphrase: 'pass'
  }
});
```
or

```javascript
var fs = require("fs");
jsonApi.setConfig({
  protocol: "https",
  port: 16006,
  tls: {
    pfx: fs.readFileSync('server.pfx'),
    passphrase: 'pass'
  }
});
```

For a full set of tls options, see https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener

#### Error Handling

```javascript
jsonApi.onUncaughtException(function(request, error) {
  // log the error somewhere
});
```

#### Basic Authentication

```javascript
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

Note: You should only start the server once you've called `setConfig` as per the example above. Resources can be defined before OR after the server has been started.

```javascript
jsonApi.start();
```

#### Stopping jsonapi-server

To gracefully shutdown the service, you can call `.close()`. This will inform all handlers that the server is shutting down, they'll have an opportunity to close any open files or connections, then the HTTP server will stop listening.

```javascript
jsonApi.close();
```

#### Gaining access to the Express server

Whilst interfering with the routing layer of jsonapi-server is not recommended (any modifications you make will go against the specification) I can appreciate the needs of businesses and the need to get stuff done. There is therefore an accessor to enable a consumer of jsonapi-server to inject their own custom routes / middleware BEFORE the json:api routes and middleware are applied.

```javascript
var app = jsonApi.getExpressServer();
app.use(someMiddleware);
jsonApi.start() // this line applies the json:api routing and starts the service
```
