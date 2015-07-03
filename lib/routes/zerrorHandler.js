"use strict";
var errorHandler = module.exports = { };

var helper = require("./helper.js");
var router = require("../router.js");


errorHandler.register = function() {
  router.bindErrorHandler(function(request, res, error) {

    var errorDetails = error.stack.split("\n");
    console.log(JSON.stringify({
      request: request,
      error: errorDetails.shift(),
      stack: errorDetails
    }));

    return helper.handleError(request, res, {
      status: "500",
      code: "EUNKNOWN",
      title: "An unknown error has occured. Sorry?",
      detail: "??"
    });
  });
};
