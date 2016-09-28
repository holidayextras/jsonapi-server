const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApi = require('../lib/jsonApi')
const jsonApiTestServer = require('../example/server')

describe('Testing jsonapi-server', () => {
  describe('resource readiness', () => {
    it('returns 200 if resource is ready', done => {
      const url = 'http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014'
      helpers.request({
        method: 'GET',
        url
      }, (err, res) => {
        assert(!err)
        assert.strictEqual(res.statusCode, 200, 'Expecting 200 OK')
        done()
      })
    })

    it('returns 503 if resource is NOT ready', done => {
      const handlers = jsonApi._resources.articles.handlers
      const savedHandlersReady = handlers.ready
      handlers.ready = false
      const url = 'http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014'
      helpers.request({
        method: 'GET',
        url
      }, (err, res) => {
        assert(!err)
        assert.strictEqual(res.statusCode, 503, 'Expecting 503 SERVICE UNAVAILABLE')
        handlers.ready = savedHandlersReady
        done()
      })
    })
  })

  before(() => {
    jsonApiTestServer.start()
  })
  after(() => {
    jsonApiTestServer.close()
  })
})
