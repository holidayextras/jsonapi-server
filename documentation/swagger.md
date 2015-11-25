
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
