'use strict'
const metrics = module.exports = { }

const EventEmitter = require('events').EventEmitter
metrics.emitter = new EventEmitter()

metrics._replaceUUIDsInRoute = routeString => routeString.replace(/[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/ig, ':id')

metrics._replaceTrailingSlashesInRoute = routeString => routeString.replace(/\/$/, '')

metrics.processResponse = (request, httpCode, payload, duration) => {
  let route = request ? request.route.path : 'invalid'
  route = metrics._replaceUUIDsInRoute(route)
  route = metrics._replaceTrailingSlashesInRoute(route)

  metrics.emitter.emit('data', {
    route,
    verb: request ? request.route.verb || 'GET' : 'GET',
    httpCode,
    error: payload.errors ? payload.errors[0].title : null,
    duration: duration || 0
  })
}
