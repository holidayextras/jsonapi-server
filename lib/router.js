'use strict'
const router = module.exports = { }

const _ = {
  assign: require('lodash.assign'),
  omit: require('lodash.omit')
}
const express = require('express')
let app
let server
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const jsonApi = require('./jsonApi.js')
const debug = require('./debugging.js')
const responseHelper = require('./responseHelper.js')
const url = require('url')
const metrics = require('./metrics.js')
const graphQl = require('./graphQl/index.js')

router.applyMiddleware = () => {
  app = app || jsonApi._apiConfig.router || express()
  app.use((req, res, next) => {
    res.set({
      'Content-Type': 'application/vnd.api+json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '',
      'Cache-Control': 'private, must-revalidate, max-age=0',
      'Expires': 'Thu, 01 Jan 1970 00:00:00'
    })

    if (req.method === 'OPTIONS') {
      return res.status(204).end()
    }

    return next()
  })

  app.use((req, res, next) => {
    if (!req.headers['content-type'] && !req.headers.accept) return next()

    if (req.headers['content-type']) {
      // 415 Unsupported Media Type
      if (req.headers['content-type'].match(/^application\/vnd\.api\+json;.+$/)) {
        return res.status(415).end(`HTTP 415 Unsupported Media Type - [${req.headers['content-type']}]`)
      }

      // Convert "application/vnd.api+json" content type to "application/json".
      // This enables the express body parser to correctly parse the JSON payload.
      if (req.headers['content-type'].match(/^application\/vnd\.api\+json$/)) {
        req.headers['content-type'] = 'application/json'
      }
    }

    if (req.headers.accept) {
      // 406 Not Acceptable
      let matchingTypes = req.headers.accept.split(/, ?/)
      matchingTypes = matchingTypes.filter(mediaType => // Accept application/*, */vnd.api+json, */* and the correct JSON:API type.
      mediaType.match(/^(\*|application)\/(\*|json|vnd\.api\+json)$/) || mediaType.match(/\*\/\*/))

      if (matchingTypes.length === 0) {
        return res.status(406).end()
      }
    }

    return next()
  })

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(cookieParser())
  if (!jsonApi._apiConfig.router) {
    app.disable('x-powered-by')
    app.disable('etag')
  }
  graphQl.with(app)

  let requestId = 0
  app.route('*').all((req, res, next) => {
    debug.requestCounter(requestId++, req.method, req.url)
    if (requestId > 1000) requestId = 0
    next()
  })
}

router.listen = port => {
  if (!server) {
    if (jsonApi._apiConfig.protocol === 'https') {
      server = require('https').createServer(jsonApi._apiConfig.tls || {}, app)
    } else {
      server = require('http').createServer(app)
    }
    server.listen(port)
  }
}

router.close = () => {
  if (server) {
    server.close()
    server = null
  }
}

router._routes = { }
router.bindRoute = (config, callback) => {
  const path = jsonApi._apiConfig.base + config.path
  const verb = config.verb.toLowerCase()

  const routeHandler = (req, res, extras) => {
    let request = router._getParams(req)
    request = _.assign(request, extras)
    const resourceConfig = jsonApi._resources[request.params.type]
    request.resourceConfig = resourceConfig
    res._request = request
    res._startDate = new Date()
    router.authenticate(request, res, () => callback(request, resourceConfig, res))
  }
  router._routes[verb] = router._routes[verb] || { }
  router._routes[verb][config.path] = routeHandler
  app[verb](path, routeHandler)
}

router.authenticate = (request, res, callback) => {
  if (!router._authFunction) return callback()

  router._authFunction(request, err => {
    if (!err) return callback()

    const errorWrapper = {
      status: '401',
      code: 'UNAUTHORIZED',
      title: 'Authentication Failed',
      detail: err || 'You are not authorised to access this resource.'
    }
    const payload = responseHelper.generateError(request, errorWrapper)
    res.status(401).end(new Buffer(JSON.stringify(payload)))
  })
}

router.authenticateWith = authFunction => {
  router._authFunction = authFunction
}

router.bind404 = callback => {
  app.use((req, res) => {
    const request = router._getParams(req)
    return callback(request, res)
  })
}

router.bindErrorHandler = callback => {
  app.use((error, req, res, next) => {
    const request = router._getParams(req)
    return callback(request, res, error, next)
  })
}

router._getParams = req => {
  let urlParts = req.url.split(jsonApi._apiConfig.base)
  urlParts.shift()
  urlParts = urlParts.join(jsonApi._apiConfig.base).split('?')

  const headersToRemove = [
    'host', 'connection', 'accept-encoding', 'accept-language', 'content-length'
  ]

  let combined
  let reqUrl = req.url
  if (jsonApi._apiConfig.urlPrefixAlias) {
    combined = jsonApi._apiConfig.urlPrefixAlias.replace(/\/$/, '')
    reqUrl = reqUrl.replace(jsonApi._apiConfig.base, '/')
  } else {
    combined = url.format({
      protocol: jsonApi._apiConfig.protocol,
      hostname: jsonApi._apiConfig.hostname,
      port: jsonApi._apiConfig.port
    })
  }

  combined += reqUrl

  return {
    params: _.assign(req.params, req.body, req.query),
    headers: req.headers,
    safeHeaders: _.omit(req.headers, headersToRemove),
    cookies: req.cookies,
    originalUrl: req.originalUrl,
    route: {
      verb: req.method,
      host: req.headers.host,
      base: jsonApi._apiConfig.base,
      path: urlParts.shift() || '',
      query: urlParts.shift() || '',
      combined
    }
  }
}

router.sendResponse = (res, payload, httpCode) => {
  const timeDiff = (new Date()) - res._startDate
  metrics.processResponse(res._request, httpCode, payload, timeDiff)
  res.status(httpCode).end(new Buffer(JSON.stringify(payload)))
}

router.getExpressServer = () => {
  app = app || jsonApi._apiConfig.router || express()
  return app
}
