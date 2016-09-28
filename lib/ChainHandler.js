/* @flow weak */
'use strict'

var async = require('async')

var ChainHandler = module.exports = function ChainHandler () { }

ChainHandler.prototype.chain = function (otherHandler) {
  var self = this
  if (self.otherHandler instanceof ChainHandler) {
    self.otherHandler.chain(otherHandler)
    return self
  }
  self.otherHandler = otherHandler
  self.ready = true
  return self
};

[ 'Initialise', 'Search', 'Find', 'Create', 'Delete', 'Update' ].forEach(function (action) {
  var lowerAction = action.toLowerCase()
  ChainHandler.prototype[lowerAction] = function (request) {
    var self = this
    var argsIn = Array.prototype.slice.call(arguments)
    var callback = argsIn.pop()
    // This block catches invocations to synchronous functions (.initialise())
    if (!(callback instanceof Function)) {
      argsIn.push(callback)
      if (self['before' + action]) self['before' + action].apply(self, argsIn)
      self.otherHandler[lowerAction].apply(self.otherHandler, argsIn)
      if (self['after' + action]) self['after' + action].apply(self, argsIn)
      return
    }
    async.waterfall([
      function (callback) {
        return callback.apply(null, [null].concat(argsIn))
      },
      function () {
        var argsOut = Array.prototype.slice.call(arguments)
        if (!self['before' + action]) return argsOut.pop().apply(self, [null].concat(argsOut))
        self['before' + action].apply(self, argsOut)
      },
      self.otherHandler[lowerAction].bind.apply(self.otherHandler[lowerAction], [self.otherHandler]), // eslint-disable-line no-useless-call
      function () {
        var argsOut = Array.prototype.slice.call(arguments)
        if (!self['after' + action]) return argsOut.pop().apply(self, [null].concat(argsOut))
        self['after' + action].apply(self, [request].concat(argsOut))
      }
    ], callback)
  }
})
