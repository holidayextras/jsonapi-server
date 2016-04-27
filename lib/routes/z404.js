/* @flow weak */
"use strict";
var fourOhFour = module.exports = { };

var helper = require("./helper.js");
var router = require("../router.js");


fourOhFour.register = function() {
  router.bind404(function(request, res) {
    return helper.handleError(request, res, {
      status: "404",
      code: "EINVALID",
      title: "Invalid Route",
      detail: "This is not the API you are looking for?"
    });
  });
};
