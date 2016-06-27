/* @flow weak */
"use strict";
var metrics = module.exports = { };

var EventEmitter = require("events").EventEmitter;
metrics.emitter = new EventEmitter();

metrics._replaceUUIDsInRoute = function(routeString) {
  return routeString.replace(/[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/ig, ":id");
};

metrics._replaceTrailingSlashesInRoute = function(routeString) {
  return routeString.replace(/\/$/, "");
};

metrics.processResponse = function(request, httpCode, payload, duration) {
  var route = request ? request.route.path : "invalid";
  route = metrics._replaceUUIDsInRoute(route);
  route = metrics._replaceTrailingSlashesInRoute(route);

  metrics.emitter.emit("data", {
    route: route,
    verb: request ? request.route.verb || "GET" : "GET",
    httpCode: httpCode,
    error: payload.errors ? payload.errors[0].title : null,
    duration: duration || 0
  });
};
