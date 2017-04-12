'use strict'
const removeRelationRoute = module.exports = { }

const async = require('async')
const helper = require('./helper.js')
const router = require('../router.js')
const postProcess = require('../postProcess.js')
const responseHelper = require('../responseHelper.js')

removeRelationRoute.register = () => {
  router.bindRoute({
    verb: 'delete',
    path: ':type/:id/relationships/:relation'
  }, (request, resourceConfig, res) => {
    let newResource
    let theirResource
    let response

    async.waterfall([
      callback => {
        helper.verifyRequest(request, resourceConfig, res, 'update', callback)
      },
      callback => {
        helper.verifyRequest(request, resourceConfig, res, 'find', callback)
      },
      callback => {
        helper.checkForBody(request, callback)
      },
      callback => {
        resourceConfig.handlers.find(request, callback)
      },
      (ourResource, callback) => {
        theirResource = ourResource

        const isMany = resourceConfig.attributes[request.params.relation]._settings.__many
        const isOne = resourceConfig.attributes[request.params.relation]._settings.__one
        const relationType = isMany || isOne
        let theirs = request.params.data
        if (!(theirs instanceof Array)) {
          theirs = [ theirs ]
        }

        const keys = [].concat(theirResource[request.params.relation]).map(j => j.id)

        for (let i = 0; i < theirs.length; i++) {
          if (relationType.indexOf(theirs[i].type) === -1) {
            return callback({
              status: '403',
              code: 'EFORBIDDEN',
              title: 'Invalid Request',
              detail: `Invalid type ${theirs[i].type}`
            })
          }
          const someId = theirs[i].id
          const indexOfTheirs = keys.indexOf(someId)
          if (indexOfTheirs === -1) {
            return callback({
              status: '403',
              code: 'EFORBIDDEN',
              title: 'Invalid Request',
              detail: `Unknown id ${someId}`
            })
          }
          if (isMany) {
            theirResource[request.params.relation].splice(indexOfTheirs, 1)
          }
        }

        if (!isMany) {
          theirResource[request.params.relation] = null
        }

        helper.validate(theirResource, resourceConfig.onCreate, callback)
      },
      callback => {
        resourceConfig.handlers.update(request, theirResource, callback)
      },
      (result, callback) => {
        resourceConfig.handlers.find(request, callback)
      },
      (result, callback) => {
        newResource = result
        postProcess.fetchForeignKeys(request, newResource, resourceConfig.attributes, callback)
      },
      callback => {
        responseHelper._enforceSchemaOnObject(newResource, resourceConfig.attributes, callback)
      },
      (sanitisedData, callback) => {
        sanitisedData = sanitisedData.relationships[request.params.relation].data
        response = responseHelper._generateResponse(request, resourceConfig, sanitisedData)
        postProcess.handle(request, response, callback)
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)
      router.sendResponse(res, response, 200)
    })
  })
}
