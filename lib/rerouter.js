/* @flow weak */
"use strict";
var rerouter = module.exports = { };

var router = require("./router.js");
var jsonApi = require("./jsonApi.js");
var url = require("qs");


rerouter.route = function(newRequest, callback) {
  var validRoutes = router._routes[newRequest.method.toLowerCase()];

  var path = newRequest.uri;
  if (path.match(/^https?\:\/\//)) {
    path = path.split("/").slice(3).join("/");
  }
  if (jsonApi._apiConfig.base !== "/") {
    if (path[0] !== "/") path = "/" + path;
    path = path.split(jsonApi._apiConfig.base);
    path.shift();
    path = path.join(jsonApi._apiConfig.base);
  }
  path = path.replace(/^\//, "").split("?")[0].replace(/\/$/, "");

  var route = Object.keys(validRoutes).filter(function(someRoute) {
    someRoute = someRoute.replace(/(\:[a-z]+)/g, "[^/]*?");
    someRoute = new RegExp("^" + someRoute);
    return someRoute.test(path);
  }).pop();
  var req = {
    url: newRequest.uri,
    headers: newRequest.headers,
    cookies: newRequest.cookies,
    params: url.parse(newRequest.uri.split("?").pop())
  };

  route.split("/").forEach(function(urlPart, i) {
    if (urlPart[0] !== ":") return;
    req.params[urlPart.substring(1)] = path.split("/")[i];
  });

  var res = {
    status: function(httpCode) {
      res.httpCode = httpCode;
      return res;
    },
    json: function(payload) {
      var err = null;
      if (res.httpCode >= 400) {
        err = payload;
        payload = undefined;
      }
      return callback(err, payload);
    }
  };
  validRoutes[route](req, res);
};
