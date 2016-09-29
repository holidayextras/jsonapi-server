'use strict'
const findRoute = module.exports = { }

const async = require('async')
const helper = require('./helper.js')
const router = require('../router.js')
const filter = require('../filter.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')

findRoute.register = () => {
  router.bindRoute({
    verb: 'get',
    path: ':type/:id'
  }, (request, resourceConfig, res) => {
    let resource
    let response

    async.waterfall([
      callback => {
        helper.verifyRequest(request, resourceConfig, res, 'find', callback)
      },
      function parseAndValidateFilter (callback) {
        return callback(filter.parseAndValidate(request))
      },
      callback => {
        resourceConfig.handlers.find(request, callback)
      },
      (result, callback) => {
        resource = result
        postProcess.fetchForeignKeys(request, resource, resourceConfig.attributes, callback)
      },
      callback => {
        responseHelper._enforceSchemaOnObject(resource, resourceConfig.attributes, callback)
      },
      (sanitisedData, callback) => {
        if (!sanitisedData) {
          return callback({
            status: '404',
            code: 'EVERSION',
            title: 'Resource is not valid',
            detail: 'The requested resource does not conform to the API specification. This is usually the result of a versioning change.'
          })
        }
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
        response.included = [ ]
        postProcess.handle(request, response, callback)
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)
      return router.sendResponse(res, response, 200)
    })
  })
}
