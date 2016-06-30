/* @flow weak */
"use strict";
var router = module.exports = { };

var _ = {
  assign: require("lodash.assign"),
  omit: require("lodash.omit")
};
var express = require("express");
var app = express();
var server;
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var jsonApi = require("./jsonApi.js");
var debug = require("./debugging.js");
var responseHelper = require("./responseHelper.js");
var url = require("url");
var metrics = require("./metrics.js");


router.applyMiddleware = function() {
  app.use(function(req, res, next) {
    if (!req.headers["content-type"] && !req.headers.accept) return next();

    if (req.headers["content-type"]) {
      // 415 Unsupported Media Type
      if (req.headers["content-type"].match(/^application\/vnd\.api\+json;.+$/)) {
        return res.status(415).end();
      }

      // Convert "application/vnd.api+json" content type to "application/json".
      // This enables the express body parser to correctly parse the JSON payload.
      if (req.headers["content-type"].match(/^application\/vnd\.api\+json$/)) {
        req.headers["content-type"] = "application/json";
      }
    }

    if (req.headers.accept) {
      // 406 Not Acceptable
      var matchingTypes = req.headers.accept.split(/, ?/);
      matchingTypes = matchingTypes.filter(function(mediaType) {
        // Accept application/*, */vnd.api+json, */* and the correct JSON:API type.
        return mediaType.match(/^(\*|application)\/(\*|vnd\.api\+json)$/) || mediaType.match(/\*\/\*/);
      });

      if (matchingTypes.length === 0) {
        return res.status(406).end();
      }
    }

    return next();
  });

  app.use(function(req, res, next) {
    res.set({
      "Content-Type": "application/vnd.api+json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": req.headers["access-control-request-headers"] || "",
      "Cache-Control": "private, must-revalidate, max-age=0",
      "Expires": "Thu, 01 Jan 1970 00:00:00"
    });

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    return next();
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.disable("x-powered-by");
  app.disable("etag");

  var requestId = 0;
  app.route("*").all(function(req, res, next) {
    debug.requestCounter(requestId++, req.method, req.url);
    if (requestId > 1000) requestId = 0;
    next();
  });
};

router.listen = function(port) {

  if (!server) {
    if (jsonApi._apiConfig.protocol === "https") {
      server = require("https").createServer(jsonApi._apiConfig.tls || {}, app);
    } else {
      server = require("http").createServer(app);
    }
    server.listen(port);
  }
};

router.close = function() {
  server.close();
  server = null;
};

router._routes = { };
router.bindRoute = function(config, callback) {
  var path = jsonApi._apiConfig.base + config.path;
  var verb = config.verb.toLowerCase();

  var routeHandler = function(req, res, extras) {
    var request = router._getParams(req);
    request = _.assign(request, extras);
    var resourceConfig = jsonApi._resources[request.params.type];
    request.resourceConfig = resourceConfig;
    res._request = request;
    res._startDate = new Date();
    router.authenticate(request, res, function() {
      return callback(request, resourceConfig, res);
    });
  };
  router._routes[verb] = router._routes[verb] || { };
  router._routes[verb][config.path] = routeHandler;
  app[verb](path, routeHandler);
};

router.authenticate = function(request, res, callback) {
  if (!router._authFunction) return callback();

  router._authFunction(request, function(err) {
    if (!err) return callback();

    var errorWrapper = {
      status: "401",
      code: "UNAUTHORIZED",
      title: "Authentication Failed",
      detail: err || "You are not authorised to access this resource."
    };
    var payload = responseHelper.generateError(request, errorWrapper);
    res.status(401).json(payload);
  });
};

router.authenticateWith = function(authFunction) {
  router._authFunction = authFunction;
};

router.bind404 = function(callback) {
  app.use(function(req, res) {
    var request = router._getParams(req);
    return callback(request, res);
  });
};

router.bindErrorHandler = function(callback) {
  app.use(function(error, req, res, next) {
    var request = router._getParams(req);
    return callback(request, res, error, next);
  });
};

router._getParams = function(req) {
  var urlParts = req.url.split(jsonApi._apiConfig.base);
  urlParts.shift();
  urlParts = urlParts.join(jsonApi._apiConfig.base).split("?");

  var headersToRemove = [
    "host", "connection", "accept-encoding", "accept-language", "content-length"
  ];

  return {
    params: _.assign(req.params, req.body, req.query),
    headers: req.headers,
    safeHeaders: _.omit(req.headers, headersToRemove),
    cookies: req.cookies,
    route: {
      verb: req.method,
      host: req.headers.host,
      base: jsonApi._apiConfig.base,
      path: urlParts.shift() || "",
      query: urlParts.shift() || "",
      combined: url.format({
        protocol: jsonApi._apiConfig.protocol,
        hostname: jsonApi._apiConfig.hostname,
        port: jsonApi._apiConfig.port
      }) + req.url
    }
  };
};

router.sendResponse = function(res, payload, httpCode) {
  var timeDiff = (new Date()) - res._startDate;
  metrics.processResponse(res._request, httpCode, payload, timeDiff);
  res.status(httpCode).json(payload);
};

router.getExpressServer = function() {
  return app;
};
