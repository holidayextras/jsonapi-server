'use strict'
const swagger = module.exports = { }
const jsonApi = require('../../')
const url = require('url')
const swaggerPaths = require('./paths.js')
const swaggerResources = require('./resources.js')

swagger.generateDocumentation = () => {
  const swaggerDoc = swagger._getSwaggerBase()
  swaggerDoc.paths = swaggerPaths.getPathDefinitions(jsonApi)
  swaggerDoc.definitions = swaggerResources.getResourceDefinitions(jsonApi)
  return swaggerDoc
}

swagger._getSwaggerBase = () => {
  const swaggerConfig = jsonApi._apiConfig.swagger || { }
  let basePath, host, protocol
  if (jsonApi._apiConfig.urlPrefixAlias) {
    const urlObj = url.parse(jsonApi._apiConfig.urlPrefixAlias)
    basePath = urlObj.pathname.replace(/(?!^\/)\/$/, '')
    host = urlObj.host
    protocol = urlObj.protocol.replace(/:$/, '')
  } else {
    host = jsonApi._apiConfig.host
    basePath = jsonApi._apiConfig.base.substring(0, jsonApi._apiConfig.base.length - 1)
    protocol = jsonApi._apiConfig.protocol
  }
  return {
    swagger: '2.0',
    info: {
      title: swaggerConfig.title,
      version: swaggerConfig.version,
      description: swaggerConfig.description,
      contact: {
        name: (swaggerConfig.contact || { }).name,
        email: (swaggerConfig.contact || { }).email,
        url: (swaggerConfig.contact || { }).url
      },
      license: {
        name: (swaggerConfig.license || { }).name,
        url: (swaggerConfig.license || { }).url
      }
    },
    host,
    basePath,
    schemes: [ protocol ],
    consumes: [
      'application/vnd.api+json'
    ],
    produces: [
      'application/vnd.api+json'
    ],
    parameters: {
      sort: {
        name: 'sort',
        in: 'query',
        description: 'Sort resources as per the JSON:API specification',
        required: false,
        type: 'string'
      },
      include: {
        name: 'include',
        in: 'query',
        description: 'Fetch additional resources as per the JSON:API specification',
        required: false,
        type: 'string'
      },
      filter: {
        name: 'filter',
        in: 'query',
        description: 'Filter resources as per the JSON:API specification',
        required: false,
        type: 'string'
      },
      fields: {
        name: 'fields',
        in: 'query',
        description: 'Limit response payloads as per the JSON:API specification',
        required: false,
        type: 'string'
      },
      page: {
        name: 'page',
        in: 'query',
        description: 'Pagination namespace',
        required: false,
        type: 'string'
      }
    },
    paths: { },
    definitions: { }
  }
}
