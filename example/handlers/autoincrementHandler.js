'use strict'

const jsonApi = require('../..')

const chainHandler = new jsonApi.ChainHandler()

let i = 2 // 1 is used by the example in resources/autoincrement.js
chainHandler.beforeCreate = (request, newResource, callback) => {
  // Autoincrement the ID.
  // In practice this would actually be handled by the underlying database.
  newResource.id = (i++).toString()
  callback(null, request, newResource)
}

module.exports = chainHandler.chain(new jsonApi.MemoryHandler())
