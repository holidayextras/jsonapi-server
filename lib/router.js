"use strict";
var router = module.exports = { };

var _ = require("underscore");
var express = require("express");
var app = express();
var server;
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
var jsonApi = require("./jsonApi.js");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.disable("x-powered-by");
app.disable("etag");

// var requestId = 0;
// app.route("*").all(function(req, res, next) {
//   req.query.requestId = requestId;
//   console.log(requestId, "===", req.url);
//   requestId++;
//   next();
// });

router.listen = function(port) {
  if (!server) {
    server = app.listen(port);
  }
};

router.close = function() {
  server.close();
  server = null;
};

router.bindRoute = function(config, callback) {
  app[config.verb](jsonApi._apiConfig.base + config.path, function(req, res) {
    var request = router._getParams(req);
    var resourceConfig = jsonApi._resources[request.params.type];
    router._setResponseHeaders(request, res);
    request.resourceConfig = resourceConfig;
    return callback(request, resourceConfig, res);
  });
};

router.bind404 = function(callback) {
  app.use(function(req, res) {
    var request = router._getParams(req);
    router._setResponseHeaders(request, res);
    return callback(request, res);
  });
};

router.bindErrorHandler = function(callback) {
  app.use(function(error, req, res, next) {
    var request = router._getParams(req);
    router._setResponseHeaders(request, res);
    return callback(request, res, error, next);
  });
};

router._getParams = function(req) {
  var urlParts = req.url.split("?");
  return {
    params: _.extend(req.params, req.body, req.query),
    headers: req.headers,
    cookies: req.cookies,
    route: {
      host: req.headers.host,
      base: jsonApi._apiConfig.base,
      path: urlParts.shift() || "",
      query: urlParts.shift() || "",
      combined: "https://" + req.headers.host + req.url
    }
  };
};

router._setResponseHeaders = function(request, res) {
  res.set({
    "Content-Type": "application/vnd.api+json",
    "Location": request.route.combined,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*"
  });
};

router.sendResponse = function(res, payload, httpCode) {
  res.status(httpCode).json(payload);
};
