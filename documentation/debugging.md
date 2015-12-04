
### Debugging

Debug output is provided by the [debug](https://www.npmjs.com/package/debug) module.

The supported namespaces are:

 - jsonApi:handler:search
 - jsonApi:handler:find
 - jsonApi:handler:create
 - jsonApi:handler:delete
 - jsonApi:handler:update
 - jsonApi:validation:input
 - jsonApi:validation:output
 - jsonApi:include
 - jsonApi:filter
 - jsonApi:errors


To view the debugging output, provide a comma separated list (or wildcarded via `*`) of namespaces in the `DEBUG` environment variable, for example:
```
$ DEBUG=jsonApi:handler:find npm test
```
```
$ DEBUG=jsonApi:handler:* npm test
```
