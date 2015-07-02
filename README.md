[![Coverage Status](https://coveralls.io/repos/holidayextras/jsonapi-server/badge.svg?branch=master)](https://coveralls.io/r/holidayextras/jsonapi-server?branch=master)
[![Build Status](https://travis-ci.org/holidayextras/jsonapi-server.svg?branch=master)](https://travis-ci.org/holidayextras/jsonapi-server)
[![Code Climate](https://codeclimate.com/github/holidayextras/jsonapi-server/badges/gpa.svg)](https://codeclimate.com/github/holidayextras/jsonapi-server)

# jsonapi-server

`jsonapi-server` is a fully featured NodeJS sever implementation of `json:api`. You provide the resources, we provide the api.

### The tl;dr

You can have a complete json:api server providing a `photos` resource with just this:
```javascript
var jsonApi = require("../.");

jsonApi.setConfig({
  base: "rest",
  port: 16006,
  meta: {
    "allMetaBlocks": "contain this data"
  }
});

jsonApi.define({
  resource: "photos",
  handlers: jsonApi.mockHandlers,
  attributes: {
    title: jsonApi.Joi.string()
    url: jsonApi.Joi.string().uri()
    height: jsonApi.Joi.number().min(1).max(10000).precision(0)
    width: jsonApi.Joi.number().min(1).max(10000).precision(0)
  },
  examples: [
    {
      id: "aab14844-97e7-401c-98c8-0bd5ec922d93",
      type: "photos",
      title: "Matrix Code",
      url: "http://www.example.com/foobar",
      height: 1080,
      width: 1920
    }
  ]
});

jsonApi.start();
```
Your new API will be alive at http://localhost:16006/rest/ and your photos resources will be at http://localhost:16006/rest/photos

### I want to see it!!

Fire up an example `json:api` server using the resources mentioned in the official spec via:
```
git clone https://github.com/holidayextras/jsonapi-server.git
npm install
npm start
```
and browse to
```
http://localhost:16006/rest/
```

### Defining a json:api resource

```javascript
jsonApi.define({
  resource: "resourceNameGoesHere",
  handlers: { /* see "Handlers" section */ },
  searchParams: { /* see "SearchParams" section */ },
  attributes: { /* see "attributes" section */ }
});
```

### Handlers

Handlers represent the mechanism that backs a resource. Each handler is expected to provide some of the following functions:
* initialise - when jsonapi-server loads, this is invoked once for every resource using this handler. Its an opportunity to allocate memory, connect to databases, etc.
* search - for searching for resources that match some vague parameters.
* find - for finding a specific resource by id.
* create - for creating a new instance of a resource.
* delete - for deleting an existing resource.
* update - for updating an existing resource.

Failure to provide the above handler functions will result in `EFORBIDDEN` HTTP errors if the corresponding routes are called.

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
In the above example the `photographer` attribute is defined as relation to a resource of type `people`. jsonapi-server will deal with shuffling around and separating those attibutes and relations when it needs to. Keep It Simple.

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

#### jsonApi.mockHandlers

jsonapi-server ships with an example barebones implementation of an in-memory handler. It can be found at `jsonApi.mockHandlers`. You can use it as a reference for writing new handlers.

`mockHandlers` works by allowing each defined resource to contain an `examples` property, which must be an array of JSON objects representing raw resources. Those examples are loaded into memory when the server loads and are served up as if they were real resources. You can search through them, modify them, create new ones, delete them, straight away.

Its a beautiful way of prototyping an experimental new API! Simply define the attributes of a resource, attach the `mockHandlers` and define some `examples`:

```javascript
jsonApi.define({
  resource: "photos",
  handlers: jsonApi.mockHandlers,
  attributes: {
    title: jsonApi.Joi.string()
    url: jsonApi.Joi.string().uri().required()
    photographer: jsonApi.Joi.one("people")
      .description("The person who took the photo"),
    articles: jsonApi.Joi.belongsToMany({
      resource: "articles",
      as: "photos"
    })
  },
  examples: [
    {
      id: "aab14844-97e7-401c-98c8-0bd5ec922d93",
      type: "photos",
      title: "Matrix Code",
      url: "http://www.example.com/foobar",
      photographer: { type: "people", id: "ad3aa89e-9c5b-4ac9-a652-6670f9f27587" }
    }
  ]
});
```

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


### SearchParams

A resource's `searchParams` should be declared using the version of `Joi` bundled with `jsonapi-server`:
```javascript
url: jsonApi.Joi.string().uri()
height: jsonApi.Joi.number().min(1).max(10000).precision(0)
```

In addition to the fields declared in the `searchParams` object, jsonapi-server will also accept `sort`, `include`, `fields`, `filter` and `relationships` parameters.

### Attributes

A resource's `attributes` should be declared using the version of `Joi` bundled with `jsonapi-server`:
```javascript
url: jsonApi.Joi.string().uri()
height: jsonApi.Joi.number().min(1).max(10000).precision(0)
```

In addition to the functionality provided by `Joi`, there are 4x additional types:
```javascript
photos: jsonApi.Joi.one("photos").description("This attribute is a relation to a photos resource");

article: jsonApi.Joi.belongsToOne({
  resource: "articles",
  as: "comments"
}).description("This attribute declares that the articles resource contains comments that links back to this resource");

photos: jsonApi.Joi.many("photos").description("This attribute is a relation to many photos resources");

article: jsonApi.Joi.belongsToMany({
  resource: "articles",
  as: "comments"
}).description("This attribute declares that the articles resource contains comments that links back to many of this resource");
```

Attributes can be marked as `required` using the regular `Joi` functionality. Required fields are enforced in both directions - user created/updated resources must comply with the required attributes, as must all resources provided by the server.
```javascript
url: jsonApi.Joi.string().uri().required()
```

Attributes can be declared `readonly` by attaching metadata. Any attempt to write to this attribute when creating a new resource via POST, or when amending a resource via PUT/PATCH/DELETE will result in a validation error.
```javascript
url: jsonApi.Joi.string().uri().meta("readonly").description("This attribute cannot be created nor modified by a user");
```

If you look through the example json:api resources in the `/example/resources` folder things should become clearer.

### Post Processing

The following examples can be demo'd via the example json:api implentation launched via `npm start`.

#### Inclusions

To include `author` and `tags` relations of `articles`:
http://localhost:16006/rest/articles?include=author,tags

To include `author`, `author`.`photos` and `tags` relations of `articles`:
http://localhost:16006/rest/articles?include=author.photos,tags

#### Filtering

To only show `articles` where the `title` attribute is exactly `mySpecificTitle`:
http://localhost:16006/rest/articles?filter[title]=mySpecificTitle

To only show `articles` where the `title` attribute is before `M` alphabetically:
http://localhost:16006/rest/articles?filter[title]=<M

To only show `articles` where the `title` attribute is after `M` alphabetically:
http://localhost:16006/rest/articles?filter[title]=>M

To only show `articles` where the `title` attribute is a case-insensitive match against `linux-rocks`:
http://localhost:16006/rest/articles?filter[title]=~linux-rocks

To only show `articles` where the `title` attribute contains `for`:
http://localhost:16006/rest/articles?filter[title]=:for

To only show included `authors``photos` where the `photos` `width` is greater than 500:
http://localhost:16006/rest/articles?include=author.photos&filter[author][photos][width]=>500

#### Fields

To only bring back `articles` `title` and `content` fields:
http://localhost:16006/rest/articles?fields[articles]=title,content

To only bring back `articles` `title` and `content` fields, and `photos` `url` fields:
http://localhost:16006/rest/articles?include=photos&fields[articles]=title,content&fields[photos]=url

#### Sorting

To sort `articles` `DESC` by `title`:
http://localhost:16006/rest/articles?sort=-title

To sort `articles` `ASC` by `title`:
http://localhost:16006/rest/articles?sort=+title

### Automatically Generating Documentation

Watch this space.

### The Relationship Challenge

We want to be able to back our resources in any datastore we like, in any system we like. This means we can't rely on any database layer relationships to join resources.

#### Problem: supporting back-links

In other words, each resource would maintain its own linkage.

Consider these resources:

```
Bookings have people:
  "HPABCDE": {
    owner: "Dave"
  }

People have Bookings:
  "Dave": {
    bookings: [ "HPABCDE" ]
  }
  "Fred": {
    bookings: [ ]
  }
```

If I were to update the owner of HPABCDE to "Fred":
PATCH -> /bookings/HPABCDE/relationships/owner
then the dataset would look like this:

```
Bookings have people:
  "HPABCDE": {
    owner: "Fred"
  }

People have Bookings:
  "Dave": {
    bookings: [ "HPABCDE" ]
  }
  "Fred": {
    bookings: [ ]
  }
```

Notice the reverse linkage between bookings and people is now broken. We could get around this by automatically forcing other update requests:

```
PATCH -> /bookings/HPABCDE/relationships/owner
---- becomes
PATCH -> /bookings/HPABCDE/relationships/owner
PATCH -> /people/Dave/relationships/bookings
PATCH -> /people/Fred/relationships/bookings
```

All 3x requests combined will produce the desired end linkage:

```
Bookings have people:
  "HPABCDE": {
    owner: "Dave"
  }

People have Bookings:
  "Dave": {
    bookings: [ ]
  }
  "Fred": {
    bookings: [ "HPABCDE" ]
  }
```

The number of requests vary on the relationship (1-1, 1-many, many-many, many-1).

Consider now if one of the 3 updates fails - we need to rollback the other 2. We now have to do all of this:

```
PATCH -> /bookings/HPABCDE/relationships/owner
---- becomes
GET -> /bookings/HPABCDE/relationships/owner
GET -> /people/Dave/relationships/bookings
GET -> /people/Fred/relationships/bookings
PATCH -> /bookings/HPABCDE/relationships/owner
PATCH -> /people/Dave/relationships/bookings
PATCH -> /people/Fred/relationships/bookings
[if one fails...]
PATCH -> /bookings/HPABCDE/relationships/owner
PATCH -> /people/Dave/relationships/bookings
```

There's also now a racehazard whereby two people try to update the same resource and mess up the relations. This is solvable by passing in a checksum to the PATCH requests, allowing us to identify if a resource has been remotely modified. The checksum would need to be returned as a part of the JSON:API formatted response, alongside "id" and "type".

In a nutshell - all of the above is a terrible idea.


#### Solution: we only support forward-links

This:
```
Bookings have people:
  "HPABCDE": {
    owner: "Dave"
  }

People have Bookings:
  "Dave": {
    bookings: [ ]
  }
  "Fred": {
    bookings: [ "HPABCDE" ]
  }
```
becomes:
```
Bookings have people:
  "HPABCDE": {
    owner: "Dave"
  }

People don't know about their Bookings:
  "Dave": {

  }
  "Fred": {

  }
```

HOWEVER, we still want to maintain the reverse linkage, so we'll still offer up a linkage like this:
```
/rest/people/26aa8a92-2845-4e40-999f-1fa006ec8c63/bookings
```
although under the hood, we'll re-map it to something like this:
```
/rest/bookings/relationships/?customer=26aa8a92-2845-4e40-999f-1fa006ec8c63
```
and query for `bookings` where `customer=?`.

The main gotcha here is this in this situation:
```
  Bookings maintain links to People
  People maintain links to Trips
  Trips maintain links to Bookings
```
Looking up a person creates a reverse lookup against Bookings, creating a reverse lookup against Trips, causing a reverse lookup against People, creating a reverse lookup against....

Our solution here is to add `meta` blocks to relationships to inform the consumer what kind of linage they are looking at, and to not provide foreign keys directly:
```
relationships: {
  author: {
    meta: {
      relation: "primary",
      readOnly: false
    },
    links: {
      self: "/rest/comments/6b017640-827c-4d50-8dcc-79d766abb408/relationships/author",
      related: "/rest/comments/6b017640-827c-4d50-8dcc-79d766abb408/author"
    },
    data: {
      type: "people",
      id: "ad3aa89e-9c5b-4ac9-a652-6670f9f27587"
    }
  },
  article: {
    meta: {
      relation: "foreign",
      belongsTo: "articles",
      readOnly: true
    },
    links: {
      // get information about the linkage - list of ids and types
      self: "/rest/articles/relationships/?comments=6b017640-827c-4d50-8dcc-79d766abb408",
      // get full details of all linked resources (perform a search against the foreign key)
      related: "/rest/articles/?relationships[comments]=6b017640-827c-4d50-8dcc-79d766abb408"
    }
  }
}
```
