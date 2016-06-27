
### Generating Application Metrics

Application metrics are generated and exposed via an event emitter interface. Whenever a request has been processed and it about to be returned to the customer, a `data` event will be emitted:

```javascript
jsonApi.metrics.on("data", function(data) {
  // send data to your metrics stack
});
```

This is the data made available via this interface:
```javascript
{
  route: "people/:id/parent",
  verb: "GET",
  httpCode: 200,
  error: "Optional error message",
  duration: 123
}
```
