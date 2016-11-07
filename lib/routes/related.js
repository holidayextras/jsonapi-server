'use strict'
const relatedRoute = module.exports = { }

const jsonApi = require('../jsonApi.js')
const async = require('async')
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')

relatedRoute.register = () => {
  router.bindRoute({
    verb: 'get',
    path: ':type/:id/:relation'
  }, (request, resourceConfig, res) => {
    let relation
    let mainResource
    let relatedResources
    let response

    async.waterfall([
      callback => {
        helper.verifyRequest(request, resourceConfig, res, 'find', callback)
      },
      callback => {
        relation = resourceConfig.attributes[request.params.relation]
        if (!relation || !relation._settings || !(relation._settings.__one || relation._settings.__many)) {
          return callback({
            status: '404',
            code: 'ENOTFOUND',
            title: 'Resource not found',
            detail: 'The requested relation does not exist within the requested type'
          })
        }
        if (relation._settings.__as) {
          return callback({
            status: '404',
            code: 'EFOREIGN',
            title: 'Relation is Foreign',
            detail: 'The requested relation is a foreign relation and cannot be accessed in this manner.'
          })
        }
        callback()
      },
      callback => {
        resourceConfig.handlers.find(request, callback)
      },
      (result, callback) => {
        mainResource = result
        postProcess._fetchRelatedResources(request, mainResource, callback)
      },
      (newResources, callback) => {
        relatedResources = newResources
        if (relation._settings.__one) {
          relatedResources = relatedResources[0]
        }
        request.resourceConfig = (relation._settings.__one || relation._settings.__many).map(resourceName => {
          return jsonApi._resources[resourceName]
        })
        response = responseHelper._generateResponse(request, resourceConfig, relatedResources)
        if (relatedResources !== null) {
          response.included = [ ]
        }
        postProcess.handle(request, response, callback)
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)
      return router.sendResponse(res, response, 200)
    })
  })
}
