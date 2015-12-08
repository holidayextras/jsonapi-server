### Creating Custom Handlers

Handlers represent the mechanism that backs a resource. Each handler is an object expected to provide:

* a constructor with an option parameter that can be used to inject any required handler specific configuration.
* a `ready` property indicating the handler is ready to process requests.
* some of the following methods:
 * `initialise` - when jsonapi-server loads, this is invoked once for every resource using this handler. Its an opportunity to allocate memory, connect to databases, etc.
 * `search` - for searching for resources that match some vague parameters.
 * `find` - for finding a specific resource by id.
 * `create` - for creating a new instance of a resource.
 * `delete` - for deleting an existing resource.
 * `update` - for updating an existing resource.

Failure to provide the above handler functions will result in `EFORBIDDEN` HTTP errors if the corresponding REST routes are requested.

#### The `rawResource` Format

All data stored behind handlers should be stored in a developer-friendly format with both attributes and relations mingled together:
```javascript
{
  id: "aab14844-97e7-401c-98c8-0bd5ec922d93",
  type: "photos",
  title: "Matrix Code",
  url: "http://www.example.com/foobar",
  photographer: { type: "people", id: "ad3aa89e-9c5b-4ac9-a652-6670f9f27587" }
}
```
In the above example the `photographer` attribute is defined as relation to a resource of type `people`. jsonapi-server will deal with shuffling around and separating those attributes and relations when it needs to. Keep It Simple.

#### The `request` Format

All requests are presented to handlers in the following format:
```javascript
{
  params: {
    // All request parameters get combined into this object. Query params, body params, etc.
    foo: "bar"
  },
  headers: {
    // All HTTP request headers
    host: "localhost:16006",
    connection: "keep-alive"
  },
  route: {
    // Routing information
    host: "localhost:16006",
    path: "/v1/swagger.json",
    query: "foo=bar&baz=1",
    combined: "https://localhost:16006/v1/swagger.json"
  }
}
```

#### The `error` Format

All errors should be provided in the following format:
```javascript
{
  // The desired HTTP code
  status: "404",
  // A very short identifier for this error
  code: "ENOTFOUND",
  // A short human readable description
  title: "Requested resource does not exist",
  // Some detail to assist debugging
  detail: "There is no "+request.params.type+" with id "+request.params.id
}
```

#### constructor

The handler object constructor can, depending on the handler's requirements, expect a object parameter which will contain any properties required for configuring the handler. For example if the handler uses a database for persistence the configuration object will contain the properties required to connect to the database.

#### ready

The `ready` property should be set to a _truthy_ value once the handler is ready to process requests (which will usually happen at the end of `initialise`). If the handler is temporarily unable to process requests this property should be set to a _falsy_ value during the down period.

#### initialise
`initialise` is invoked with the `resourceConfig` of each resource using this handler.
```javascript
function(resourceConfig) { };
```
`resourceConfig` is the complete configuration object passed in to `jsonApi.define()`.

#### search
`search` is invoked with a `request` object (see above).
```javascript
function(request, callback) { };
```
the `callback` should be invoked with with an `error` or `null, [ rawResource ]`.

`search` needs to watch for any `request.params.relationships` parameters, they represent foreign key lookups. An example of this:
```
request.params.relationships = {
  user: "ad3aa89e-9c5b-4ac9-a652-6670f9f27587"
}
```
translates to "Find me all of the resources whose user attribute is a link to a resource with id == ad3aa89e-9c5b-4ac9-a652-6670f9f27587".

#### find
`find` is invoked with a `request` object (see above).
```
function(request, callback) { };
```
the `callback` should be invoked with with an `error` or `null, rawResource`.

#### create
`create` is invoked with a `request` object (see above) AND a `newResource` object which is an instance of `rawResource` representing a validated instance of type `request.params.type`. The `newResource` will already have an `id` and is ready to be stored as per the resource definition.
```
function(request, newResource, callback) { };
```
the `callback` should be invoked with with an `error` or `newResource`.

#### delete
`delete` is invoked with a `request` object (see above). It should delete the resource of type `request.params.type` and id `request.params.id`.
```
function(request, callback) { };
```
the `callback` should be invoked with with an `error` or `null`.

#### update
`update` is invoked with a `request` object (see above) and a `partialResource` which represents a partial instance of `rawResource` - the properties of `rawResource` need to be merged over the original resource and saved.
```
function(request, partialResource, callback) { };
```
the `callback` should be invoked with with an `error` or `null, newUpdatedResource`.
