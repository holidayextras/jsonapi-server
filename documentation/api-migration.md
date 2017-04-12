
### Migrating towards jsonapi-server from ExpressJS

If you've got an existing API powered by ExpressJS and you want to migrate towards using json:api, you're in the right place. The migration process we're running with is to:

1. Get jsonapi-server running alongside an existing express app using a path prefix.
2. Define some new resources using the in-memory handlers.
3. Lock in the resource definitions and develop custom handlers to provide data in the new formats by re-using existing functionality in the current codebase.
4. Migrate traffic over to the json:api resources.
5. Kill off the old express server.

We're using something similar to the below snippet to run jsonapi-server alongside our existing express application:

```javascript
var jsonApi = require('jsonapi-server');
var express = require('express');
var app = express();

var jsonApiRouter = new express.Router();
jsonApi.setConfig({
  router: router
});
app.use('/', jsonApiRouter);

// ..load all your resources here..
jsonApi.start();
app.listen(8080);
```
