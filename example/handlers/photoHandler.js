"use strict";
var jsonApi = require("../..");

module.exports = new jsonApi.DynamoHandler({
  region: "us-west-2",
  endpoint: "http://localhost:8000",
  accessKeyId: "AKIAJ2YTJBP7EAYPARCA",
  secretAccessKey: "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"
});
