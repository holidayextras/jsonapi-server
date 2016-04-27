/* @flow weak */
"use strict";
var errorHandler = module.exports = { };

var jsonApi = require("../jsonApi.js");
var helper = require("./helper.js");
var router = require("../router.js");


errorHandler.register = function() {
  router.bindErrorHandler(function(request, res, error) {

    if (jsonApi._errHandler) {
      jsonApi._errHandler(request, error);
    }

    return helper.handleError(request, res, {
      status: "500",
      code: "EUNKNOWN",
      title: "An unknown error has occured. Sorry?",
      detail: "??"
    });
  });
};
