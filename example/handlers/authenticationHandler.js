const jsonApi = require('../..')
const authenticationHandler = module.exports = new jsonApi.ChainHandler()

authenticationHandler.beforeSearch = (request, callback) => {
  console.log('Before Search 1')
  return callback(null, request)
}

authenticationHandler.afterSearch = (request, results, pagination, callback) => {
  console.log('After Search 1')
  return callback(null, results, pagination)
}

authenticationHandler.beforeInitialise = resourceConfig => {
  console.log('Before Initialise 1', resourceConfig.resource)
}
