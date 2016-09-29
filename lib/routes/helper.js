'use strict'
const helper = module.exports = { }

const Joi = require('joi')
const responseHelper = require('../responseHelper.js')
const router = require('../router.js')
const debug = require('../debugging.js')
const _ = {
  assign: require('lodash.assign')
}

helper.validate = (someObject, someDefinition, callback) => {
  debug.validationInput(JSON.stringify(someObject))
  Joi.validate(someObject, someDefinition, { abortEarly: false }, (err, sanitisedObject) => {
    if (err) {
      return callback({
        status: '403',
        code: 'EFORBIDDEN',
        title: 'Param validation failed',
        detail: err.details
      })
    }
    _.assign(someObject, sanitisedObject)
    callback()
  })
}

helper.checkForBody = (request, callback) => {
  if (!request.params.data) {
    return callback({
      status: '403',
      code: 'EFORBIDDEN',
      title: 'Request validation failed',
      detail: 'Missing "data" - have you sent the right http headers?'
    })
  }
  callback()
}

helper.handleError = (request, res, err) => {
  const errorResponse = responseHelper.generateError(request, err)
  const httpCode = errorResponse.errors[0].status || 500
  return router.sendResponse(res, errorResponse, httpCode)
}

helper.verifyRequest = (request, resourceConfig, res, handlerRequest, callback) => {
  if (!resourceConfig) {
    return helper.handleError(request, res, {
      status: '404',
      code: 'ENOTFOUND',
      title: 'Resource not found',
      detail: `The requested resource '${request.params.type}' does not exist`
    })
  }

  if (!resourceConfig.handlers.ready) {
    return helper.handleError(request, res, {
      status: '503',
      code: 'EUNAVAILABLE',
      title: 'Resource temporarily unavailable',
      detail: `The requested resource '${request.params.type}' is temporarily unavailable`
    })
  }

  if (!resourceConfig.handlers[handlerRequest]) {
    return helper.handleError(request, res, {
      status: '403',
      code: 'EFORBIDDEN',
      title: 'Resource not supported',
      detail: `The requested resource '${request.params.type}' does not support '${handlerRequest}'`
    })
  }

  return callback()
}
