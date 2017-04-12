'use strict'
const errorHandler = module.exports = { }

const jsonApi = require('../jsonApi.js')
const helper = require('./helper.js')
const router = require('../router.js')

errorHandler.register = () => {
  router.bindErrorHandler((request, res, error) => {
    if (jsonApi._errHandler) {
      jsonApi._errHandler(request, error)
    }

    return helper.handleError(request, res, {
      status: '500',
      code: 'EUNKNOWN',
      title: 'An unknown error has occured. Sorry?',
      detail: '??'
    })
  })
}
