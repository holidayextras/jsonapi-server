"use strict";
module.exports = {
  handler: {
    search: require("debug")("jsonApi:handler:search"),
    find: require("debug")("jsonApi:handler:find"),
    create: require("debug")("jsonApi:handler:create"),
    update: require("debug")("jsonApi:handler:update"),
    delete: require("debug")("jsonApi:handler:delete")
  },
  include: require("debug")("jsonApi:include"),
  validationInput: require("debug")("jsonApi:validation:input"),
  validationOutput: require("debug")("jsonApi:validation:output"),
  errors: require("debug")("jsonApi:errors")
};
