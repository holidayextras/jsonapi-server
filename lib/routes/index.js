'use strict'
const routes = module.exports = { }

const fs = require('fs')
const path = require('path')

routes.handlers = { }
fs.readdirSync(__dirname).filter(filename => /\.js$/.test(filename) && (filename !== 'index.js') && (filename !== 'helper.js')).sort().forEach(filename => {
  routes.handlers[filename] = require(path.join(__dirname, filename))
})

routes.register = () => {
  for (const i in routes.handlers) {
    routes.handlers[i].register()
  }
}
