const assert = require('assert')
const request = require('request')
const jsonApiTestServer = require('../example/server')

describe('Testing jsonapi-server', () => {
  describe('OPTIONS request', () => {
    it('returns 204', done => {
      const url = 'http://localhost:16006/rest/'
      request({
        method: 'OPTIONS',
        url
      }, (err, res) => {
        assert(!err)
        assert.strictEqual(res.statusCode, 204, 'Expecting 200 OK')
        assert.equal(res.headers['content-type'], 'application/vnd.api+json', 'should have a content-type')
        assert.equal(res.headers['access-control-allow-origin'], '*', 'should have CORS headers')
        assert.equal(res.headers['access-control-allow-methods'], 'GET, POST, PATCH, DELETE, OPTIONS', 'should have CORS headers')
        assert.equal(res.headers['access-control-allow-headers'], '', 'should have CORS headers')
        assert.equal(res.headers['cache-control'], 'private, must-revalidate, max-age=0', 'should have non-caching headers')
        assert.equal(res.headers.expires, 'Thu, 01 Jan 1970 00:00:00', 'should have non-caching headers')
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
