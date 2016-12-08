'use strict'

const fs = require('fs')
const path = require('path')

const express = require('express')

const jsonApi = require('../../.')

const app = express()

jsonApi.setConfig({
  port: 0,
  router: app
})

const resourcesPath = path.join(__dirname, '..', '..', 'example', 'resources')
fs.readdirSync(resourcesPath).filter(filename => /^[a-z].*\.js$/.test(filename)).map(filename => path.join(resourcesPath, filename)).forEach(require)

jsonApi.start()
const server = app.listen(0)

setTimeout(() => {
  jsonApi.close()
  server.close()
}, 500)
