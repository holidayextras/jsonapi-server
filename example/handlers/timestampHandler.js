const jsonApi = require('../..')
const timestampHandler = module.exports = new jsonApi.ChainHandler()

timestampHandler.beforeSearch = (request, callback) => {
  console.log('Before Search 2')
  return callback(null, request)
}

timestampHandler.afterSearch = (request, results, pagination, callback) => {
  console.log('After Search 2')
  return callback(null, results, pagination)
}

timestampHandler.beforeInitialise = resourceConfig => {
  console.log('Before Initialise 1', resourceConfig.resource)
}
