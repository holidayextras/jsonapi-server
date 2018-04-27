'use strict'

const jsonApi = require('../..')

const brokenResponseHandler = new jsonApi.ChainHandler()

brokenResponseHandler.afterFind = (request, result, callback) => {
  result.boolean = Number(result.boolean)
  result.number = String(result.number)
  return callback(null, result)
}

module.exports = brokenResponseHandler.chain(new jsonApi.MemoryHandler())
