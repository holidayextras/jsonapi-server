
### Automatic Swagger Documentation

To opt-in to having a `swagger.json` built for you off the back of your resource schema, simply provide a `swagger` property to `jsonApi.setConfig()` and fill out some of the fields:

```javascript
jsonApi.setConfig({
  // ...
  swagger: {
    title: "Example JSON:API Server",
    version: "0.1.1",
    description: "This is the API description block that shows up in the swagger.json",
    contact: {
      name: "API Contact",
      email: "apicontact@holidayextras.com",
      url: "docs.hapi.holidayextras.com"
    },
    license: {
      name: "MIT",
      url: "http://opensource.org/licenses/MIT"
    }
  },
  // ...
});
```

When this is done, fire up your api and take a look at your swagger file, found at: `/swagger.json`.

The example app's swagger file is available at `http://localhost:16006/rest/swagger.json`.

#### Configuring Swagger per resource

By default, the generated `swagger.json` documents all HTTP methods on all resources and relationships.  However, you may choose not to support some of these
methods in custom [handlers](handlers.md).  In such cases, you may choose to omit the corresponding documentation.  This can be configured per [resource](resources.md) by adding a
`swagger` property to the resource definition:

```javascript
jsonApi.define({
  resource: "articles",
  handlers: articleHandler,
  swagger: {
    all: ['find', 'create'],
    one: ['find', 'update', 'delete'],
    author: ['find', 'create', 'update', 'delete']
  },
  attributes: {
    title: jsonApi.Joi.string().required()
      .description("The articles title, should be between 8 and 15 words")
      .example("Learning how to use JSON:API"),
  // ...
    author: jsonApi.Joi.one("people")
      .description("The person who wrote the article"),
  },
  // ...
});

```

If the `swagger` property is not defined, then all methods are documented.

The `swagger` property may have the following elements:

   - `all`.  Defines which methods should be documented for resources.  Options are `find` and `create`.
   - `one`.  Defines which methods should be documented for individual resource objects.  Options are `find`, `update` and `delete`.
   - `<relationship>`.  Defines which methods should be documented for a relationship.  Options are `find`, `create`, `update` and `delete`.  This does not work for [Foreign relations](foreign-relations.md).
   Instead define this on the primary relation.

If any one of the `swagger` properties are not defined, then all methods for the resource or relationship are documented.

