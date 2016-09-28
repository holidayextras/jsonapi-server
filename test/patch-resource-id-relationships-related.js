const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('Updating a relation', () => {
    it('errors with invalid type', done => {
      const data = {
        method: 'patch',
        url: 'http://localhost:16006/rest/foobar/someId/relationships/author'
      }
      helpers.request(data, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '404', 'Expecting 404')

        done()
      })
    })

    it('errors with invalid id', done => {
      const data = {
        method: 'patch',
        url: 'http://localhost:16006/rest/comments/foobar/relationships/author',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': { 'type': 'people', 'id': 'ad3aa89e-9c5b-4ac9-a652-6670f9f27587' }
        })
      }
      helpers.request(data, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '404', 'Expecting 404')

        done()
      })
    })

    it('errors with a foreign relation', done => {
      const data = {
        method: 'patch',
        url: 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/relationships/article',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': { 'type': 'articles', 'id': 'de305d54-75b4-431b-adb2-eb6b9e546014' }
        })
      }
      helpers.request(data, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '403', 'Expecting 403')

        done()
      })
    })

    describe('adding', () => {
      it('updates the resource', done => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/relationships/author',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': { 'type': 'people', 'id': 'ad3aa89e-9c5b-4ac9-a652-6670f9f27587', meta: { updated: '2012-01-01' } }
          })
        }
        helpers.request(data, (err, res, json) => {
          assert.equal(err, null)
          helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')

          done()
        })
      })

      it('new resource has changed', done => {
        const url = 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/relationships/author'
        helpers.request({
          method: 'GET',
          url
        }, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')

          assert.deepEqual(json.data, {
            'type': 'people',
            'id': 'ad3aa89e-9c5b-4ac9-a652-6670f9f27587',
            'meta': {
              'updated': '2012-01-01'
            }
          })

          done()
        })
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
