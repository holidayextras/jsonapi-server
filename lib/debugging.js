'use strict'
const debug = require('debug')

function overrideDebugOutputHelper (debugFns, outputFnFactory) {
  Object.keys(debugFns).filter(key => key.substr(0, 2) !== '__').forEach(key => {
    if (debugFns[key] instanceof Function) {
      debugFns[key] = outputFnFactory(debugFns[key].namespace)
      return null
    }
    return overrideDebugOutputHelper(debugFns[key], outputFnFactory)
  })
}

const debugging = module.exports = {
  handler: {
    search: debug('jsonApi:handler:search'),
    find: debug('jsonApi:handler:find'),
    create: debug('jsonApi:handler:create'),
    update: debug('jsonApi:handler:update'),
    delete: debug('jsonApi:handler:delete')
  },
  reroute: debug('jsonApi:reroute'),
  include: debug('jsonApi:include'),
  filter: debug('jsonApi:filter'),
  validationInput: debug('jsonApi:validation:input'),
  validationOutput: debug('jsonApi:validation:output'),
  validationError: debug('jsonApi:validation:error'),
  errors: debug('jsonApi:errors'),
  requestCounter: debug('jsonApi:requestCounter'),

  __overrideDebugOutput () {}
}

debugging.__overrideDebugOutput = overrideDebugOutputHelper.bind(null, debugging)
