'use strict'
const jsonApi = module.exports = { }
jsonApi._version = require(require('path').join(__dirname, '../package.json')).version
jsonApi._resources = { }
jsonApi._apiConfig = { }

const _ = {
  assign: require('lodash.assign'),
  pick: require('lodash.pick')
}
const ourJoi = require('./ourJoi.js')
const router = require('./router.js')
const responseHelper = require('./responseHelper.js')
const handlerEnforcer = require('./handlerEnforcer.js')
const pagination = require('./pagination.js')
const routes = require('./routes')
const url = require('url')
const metrics = require('./metrics.js')
const schemaValidator = require('./schemaValidator.js')

jsonApi.Joi = ourJoi.Joi
jsonApi.metrics = metrics.emitter
jsonApi.MemoryHandler = require('./MemoryHandler')
jsonApi.ChainHandler = require('./ChainHandler')

jsonApi.setConfig = apiConfig => {
  jsonApi._apiConfig = apiConfig
  jsonApi._apiConfig.base = jsonApi._cleanBaseUrl(jsonApi._apiConfig.base)
  jsonApi._apiConfig.pathPrefix = apiConfig.urlPrefixAlias || jsonApi._concatenateUrlPrefix(jsonApi._apiConfig)
  responseHelper.setBaseUrl(jsonApi._apiConfig.pathPrefix)
  responseHelper.setMetadata(jsonApi._apiConfig.meta)
}

jsonApi.authenticate = router.authenticateWith

jsonApi._concatenateUrlPrefix = config => url.format({
  protocol: config.protocol,
  hostname: config.hostname,
  port: config.port,
  pathname: config.base
})

jsonApi._cleanBaseUrl = base => {
  if (!base) {
    base = ''
  }
  if (base[0] !== '/') {
    base = `/${base}`
  }
  if (base[base.length - 1] !== '/') {
    base += '/'
  }
  return base
}

jsonApi.define = resourceConfig => {
  if (!resourceConfig.resource.match(/^[A-Za-z0-9_]*$/)) {
    throw new Error(`Resource '${resourceConfig.resource}' contains illegal characters!`)
  }
  resourceConfig.namespace = resourceConfig.namespace || 'default'
  resourceConfig.searchParams = resourceConfig.searchParams || { }
  jsonApi._resources[resourceConfig.resource] = resourceConfig

  handlerEnforcer.wrap(resourceConfig.handlers)

  resourceConfig.handlers.initialise = resourceConfig.handlers.initialise || resourceConfig.handlers.initialize
  if (resourceConfig.handlers.initialise) {
    resourceConfig.handlers.initialise(resourceConfig)
  }

  Object.keys(resourceConfig.attributes).forEach(attribute => {
    if (!attribute.match(/^[A-Za-z0-9_]*$/)) {
      throw new Error(`Attribute '${attribute}' on ${resourceConfig.resource} contains illegal characters!`)
    }
  })

  resourceConfig.searchParams = _.assign({
    type: ourJoi.Joi.any().required().valid(resourceConfig.resource)
      .description(`Always "${resourceConfig.resource}"`)
      .example(resourceConfig.resource),
    sort: ourJoi.Joi.any()
      .description('An attribute to sort by')
      .example('title'),
    filter: ourJoi.Joi.any()
      .description('An attribute+value to filter by')
      .example('title'),
    fields: ourJoi.Joi.any()
      .description('An attribute+value to filter by')
      .example('title'),
    include: ourJoi.Joi.any()
      .description('An attribute to include')
      .example('title')
  }, resourceConfig.searchParams, pagination.joiPageDefinition)

  resourceConfig.attributes = _.assign({
    id: ourJoi.Joi.string().required()
      .description('Unique resource identifier')
      .example('1234'),
    type: ourJoi.Joi.string().required().valid(resourceConfig.resource)
      .description(`Always "${resourceConfig.resource}"`)
      .example(resourceConfig.resource),
    meta: ourJoi.Joi.object().optional()
  }, resourceConfig.attributes)

  resourceConfig.onCreate = _.pick.apply(_, [].concat(resourceConfig.attributes, Object.keys(resourceConfig.attributes).filter(i => (resourceConfig.attributes[i]._meta.indexOf('readonly') === -1) && (!(resourceConfig.attributes[i]._settings || { }).__as))))
}

jsonApi.onUncaughtException = errHandler => {
  jsonApi._errHandler = errHandler
}

jsonApi.getExpressServer = () => router.getExpressServer()

jsonApi.start = () => {
  schemaValidator.validate(jsonApi._resources)
  router.applyMiddleware()
  routes.register()
  if (!jsonApi._apiConfig.router) {
    router.listen(jsonApi._apiConfig.port)
  }
}

jsonApi.close = () => {
  router.close()
  metrics.emitter.removeAllListeners('data')
  for (const i in jsonApi._resources) {
    const resourceConfig = jsonApi._resources[i]
    if (resourceConfig.handlers.close) resourceConfig.handlers.close()
  }
}
