const request = require('request')
const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('404 pages', () => {
    it('errors with invalid type #1', done => {
      const data = {
        method: 'get',
        url: 'http://localhost:16006/res'
      }
      request(data, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '404', 'Expecting 404')

        done()
      })
    })

    it('errors with invalid type #2', done => {
      const data = {
        method: 'get',
        url: 'http://localhost:16006/rest/a/b/c/d/e'
      }
      request(data, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '404', 'Expecting 404')

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
