
### Defining a json:api resource

```javascript
jsonApi.define({
  resource: "resourceNameGoesHere",
  handlers: { /* see "Handlers" section */ },
  searchParams: { /* see "SearchParams" section */ },
  attributes: { /* see "attributes" section */ }
});
```

#### Handlers

jsonapi-server ships with an example barebones implementation of an in-memory handler. It can be found at `jsonApi.MemoryHandler`. You can use it as a reference for writing new handlers.

Documentation for creating your own handlers can be found [here](handlers.md).

`MemoryHandler` works by allowing each defined resource to contain an `examples` property, which must be an array of JSON objects representing raw resources. Those examples are loaded into memory when the server loads and are served up as if they were real resources. You can search through them, modify them, create new ones, delete them, straight away.

Its a beautiful way of prototyping an experimental new API! Simply define the attributes of a resource, attach the `MemoryHandler` and define some `examples`:

```javascript
jsonApi.define({
  resource: "photos",
  handlers: new jsonApi.MemoryHandler(),
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

### SearchParams

`searchParams` controls which parameters will be accepted when searching for resources via a `GET` request to the `/:resource/?` route.

A resource's `searchParams` should be declared using the version of `Joi` bundled with `jsonapi-server`:
```javascript
searchParams: {
  query: jsonApi.Joi.string()
}
```

In addition to the fields declared in the `searchParams` object, jsonapi-server will also accept the `sort`, `include`, `fields`, `filter` and `relationships` parameters.

### Attributes

`attributes` defines the properties declared on the given resource. A resource's `attributes` should be declared using the version of `Joi` bundled with `jsonapi-server`:
```javascript
attributes: {
  url: jsonApi.Joi.string().uri()
  height: jsonApi.Joi.number().min(1).max(10000).precision(0)
}
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

#### generateId
By default, the server autogenerates a UUID for resources which are created without specifying an ID. To disable this behavior (for example, if the database generates an ID by auto-incrementing), set `generateId` to `false`. If the resource's ID is not a UUID, it is also necessary to specify an `id` attribute with the correct type. See `/examples/resorces/autoincrement.js` for an example of such a resource.
