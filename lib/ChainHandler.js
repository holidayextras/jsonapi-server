/* @flow weak */
"use strict";

var async = require("async");

var ChainHandler = module.exports = function ChainHandler() {
};

ChainHandler.prototype.chain = function(otherHandler) {
  var self = this;
  self.otherHandler = otherHandler;
  self.ready = true
  return self;
};

[ 'Initialise', 'Search', 'Find', 'Create', 'Delete', 'Update' ].forEach(function(action) {
  var lowerAction = action.toLowerCase();
  ChainHandler.prototype[lowerAction] = function() {
    var self = this;
    var argsIn = Array.prototype.slice.call(arguments);
    var callback = argsIn.pop();
    if (!(callback instanceof Function)) {
      argsIn.push(callback);
      callback = function() { };
    }

    async.waterfall([
      function(callback) {
        if (!self['before' + action]) return callback();
        self['before' + action].apply(self, argsIn.concat(function(a, b, c, d) {
          if (a || b) return callback(a, b, c, d);
          return callback();
        }));
      },
      self.otherHandler[lowerAction].bind.apply(self.otherHandler[lowerAction], [self.otherHandler].concat(argsIn)),
      function() {
        var argsOut = Array.prototype.slice.call(arguments);
        if (!self['after' + action]) return argsOut.pop()(argsOut);
        self['after' + action].apply(self, argsOut);
      }
    ], callback);
  }
});
