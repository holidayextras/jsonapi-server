const request = require('request')
const assert = require('assert')
const jsonApiTestServer = require('../example/server.js')
const helpers = require('./helpers.js')

describe('Testing jsonapi-server', () => {
  describe('authentication', () => {
    it('blocks access with the blockMe header', done => {
      const data = {
        method: 'get',
        url: 'http://localhost:16006/rest/articles',
        headers: {
          'blockMe': 'please'
        }
      }
      request(data, (err, res, json) => {
        assert.equal(err, null)
        assert.equal(res.statusCode, '401', 'Expecting 401')
        helpers.validateError(json)
        done()
      })
    })

    it('blocks access with the blockMe cookies', done => {
      const data = {
        method: 'get',
        url: 'http://localhost:16006/rest/articles',
        headers: {
          'cookie': 'blockMe=please'
        }
      }
      request(data, (err, res, json) => {
        assert.equal(err, null)
        assert.equal(res.statusCode, '401', 'Expecting 401')
        helpers.validateError(json)
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
