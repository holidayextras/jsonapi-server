const request = require('request')
const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('unavailable functions', () => {
    it('responds with a clear error', done => {
      const data = {
        method: 'delete',
        url: 'http://localhost:16006/rest/photos/14'
      }
      request(data, (err, res, json) => {
        assert.equal(err, null)
        json = helpers.validateError(json)
        assert.equal(res.statusCode, '403', 'Expecting 403')
        assert.equal(json.errors[0].detail, "The requested resource 'photos' does not support 'delete'")

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
