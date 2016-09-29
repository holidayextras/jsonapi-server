'use strict'
const handlerEnforcer = module.exports = { }

const debug = require('./debugging.js')

handlerEnforcer.wrap = handlers => {
  handlers.search = handlerEnforcer._search(handlers)
  handlers.find = handlerEnforcer._find(handlers)
  handlers.create = handlerEnforcer._create(handlers)
  handlers.update = handlerEnforcer._update(handlers)
  handlers.delete = handlerEnforcer._delete(handlers)
}

handlerEnforcer._wrapHandler = (handlers, operation, outCount) => {
  if (typeof outCount !== 'number') {
    throw new Error('Invalid use of handlerEnforcer._wrapHandler!')
  }

  const original = handlers[operation]
  if (!original) return null
  return function () {
    const argsIn = Array.prototype.slice.call(arguments)
    const requestParams = argsIn[0].params
    const callback = argsIn.pop()
    argsIn.push(function () {
      let argsOut = Array.prototype.slice.call(arguments)
      argsOut = argsOut.slice(0, outCount)
      // $FlowFixMe: We've already ruled out any other possible types for outCount?
      while (argsOut.length < outCount) {
        argsOut.push(null)
      }
      debug.handler[operation](JSON.stringify(requestParams), JSON.stringify(argsOut))
      return callback.apply(null, argsOut)
    })
    original.apply(handlers, argsIn)
  }
}

handlerEnforcer._search = handlers => handlerEnforcer._wrapHandler(handlers, 'search', 3)

handlerEnforcer._find = handlers => handlerEnforcer._wrapHandler(handlers, 'find', 2)

handlerEnforcer._create = handlers => handlerEnforcer._wrapHandler(handlers, 'create', 2)

handlerEnforcer._update = handlers => handlerEnforcer._wrapHandler(handlers, 'update', 2)

handlerEnforcer._delete = handlers => handlerEnforcer._wrapHandler(handlers, 'delete', 1)
