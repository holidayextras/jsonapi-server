const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('Removing from a relation', () => {
    it('errors with invalid type', done => {
      const data = {
        method: 'delete',
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
        method: 'delete',
        url: 'http://localhost:16006/rest/articles/foobar/relationships/photos',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': { 'type': 'people', 'id': 'fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5' }
        })
      }
      helpers.request(data, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '404', 'Expecting 404')

        done()
      })
    })

    it('errors with unknown key', done => {
      const data = {
        method: 'delete',
        url: 'http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': { 'type': 'tags', 'id': 'foobar' }
        })
      }
      helpers.request(data, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '403', 'Expecting 403')

        done()
      })
    })

    it('errors with invalid type', done => {
      const data = {
        method: 'delete',
        url: 'http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': { 'type': 'people', 'id': '7541a4de-4986-4597-81b9-cf31b6762486' }
        })
      }
      helpers.request(data, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '403', 'Expecting 403')

        done()
      })
    })

    describe('deleting', () => {
      it('deletes the resource on many()', done => {
        const data = {
          method: 'delete',
          url: 'http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': { 'type': 'tags', 'id': '7541a4de-4986-4597-81b9-cf31b6762486' }
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
        const url = 'http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/tags'
        helpers.request({
          method: 'GET',
          url
        }, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')

          assert.deepEqual(json.data, [
            {
              'type': 'tags',
              'id': '6ec62f6d-9f82-40c5-b4f4-279ed1765492'
            }
          ])

          done()
        })
      })
    })

    describe('deleting', () => {
      it('deletes the resource on one()', done => {
        const data = {
          method: 'delete',
          url: 'http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/author',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': { 'type': 'people', 'id': 'ad3aa89e-9c5b-4ac9-a652-6670f9f27587' }
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
        const url = 'http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/author'
        helpers.request({
          method: 'GET',
          url
        }, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')
          assert.deepEqual(json.data, null)

          done()
        })
      })

      it('restore relation', done => {
        const data = {
          method: 'post',
          url: 'http://localhost:16006/rest/articles/fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5/relationships/author',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': { 'type': 'people', 'id': 'ad3aa89e-9c5b-4ac9-a652-6670f9f27587' }
          })
        }
        helpers.request(data, (err, res, json) => {
          assert.equal(err, null)
          helpers.validateJson(json)

          assert.equal(res.statusCode, '201', 'Expecting 201')

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
