'use strict'
var jsonApi = require('../..')
var timestampHandler = module.exports = new jsonApi.ChainHandler()

timestampHandler.beforeSearch = function (request, callback) {
  console.log('Before Search 2')
  return callback(null, request)
}

timestampHandler.afterSearch = function (request, results, pagination, callback) {
  console.log('After Search 2')
  return callback(null, results, pagination)
}

timestampHandler.beforeInitialise = function (resourceConfig) {
  console.log('Before Initialise 1', resourceConfig.resource)
}
