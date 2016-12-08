'use strict'
const async = require('async')

const ChainHandler = module.exports = function ChainHandler () { }

ChainHandler.prototype.chain = function (otherHandler) {
  const self = this
  if (self.otherHandler instanceof ChainHandler) {
    self.otherHandler.chain(otherHandler)
    return self
  }
  self.otherHandler = otherHandler
  self.ready = true
  return self
};

[ 'Initialise', 'Close', 'Search', 'Find', 'Create', 'Delete', 'Update' ].forEach(action => {
  const lowerAction = action.toLowerCase()
  ChainHandler.prototype[lowerAction] = function (request) {
    const self = this
    const argsIn = Array.prototype.slice.call(arguments)
    const callback = argsIn.pop()
    // This block catches invocations to synchronous functions (.initialise())
    if (!(callback instanceof Function)) {
      argsIn.push(callback)
      if (self[`before${action}`]) self[`before${action}`].apply(self, argsIn)
      if (typeof self.otherHandler[lowerAction] === 'function') {
        // sync functions like .initialise() and .close() are optional
        self.otherHandler[lowerAction].apply(self.otherHandler, argsIn)
      }
      if (self[`after${action}`]) self[`after${action}`].apply(self, argsIn)
      return
    }
    async.waterfall([
      callback => callback.apply(null, [null].concat(argsIn)),
      function () {
        const argsOut = Array.prototype.slice.call(arguments)
        if (!self[`before${action}`]) return argsOut.pop().apply(self, [null].concat(argsOut))
        self[`before${action}`].apply(self, argsOut)
      },
      self.otherHandler[lowerAction].bind.apply(self.otherHandler[lowerAction], [self.otherHandler]), // eslint-disable-line no-useless-call
      function () {
        const argsOut = Array.prototype.slice.call(arguments)
        if (!self[`after${action}`]) return argsOut.pop().apply(self, [null].concat(argsOut))
        self[`after${action}`].apply(self, [request].concat(argsOut))
      }
    ], callback)
  }
})
