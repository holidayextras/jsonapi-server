/* @flow weak */
"use strict";
var routes = module.exports = { };

var fs = require("fs");
var path = require("path");


routes.handlers = { };
fs.readdirSync(__dirname).filter(function(filename) {
  return /\.js$/.test(filename) && (filename !== "index.js") && (filename !== "helper.js");
}).sort().forEach(function(filename) {
  routes.handlers[filename] = require(path.join(__dirname, filename));
});

routes.register = function() {
  for (var i in routes.handlers) {
    routes.handlers[i].register();
  }
};
