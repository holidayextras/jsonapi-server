'use strict'
const deleteRoute = module.exports = { }

const async = require('async')
const helper = require('./helper.js')
const router = require('../router.js')
const responseHelper = require('../responseHelper.js')

deleteRoute.register = () => {
  router.bindRoute({
    verb: 'delete',
    path: ':type/:id'
  }, (request, resourceConfig, res) => {
    async.waterfall([
      callback => {
        helper.verifyRequest(request, resourceConfig, res, 'delete', callback)
      },
      callback => {
        resourceConfig.handlers.delete(request, callback)
      }
    ], err => {
      if (err) return helper.handleError(request, res, err)

      const response = {
        meta: responseHelper._generateMeta(request)
      }
      router.sendResponse(res, response, 200)
    })
  })
}
