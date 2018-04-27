'use strict'

const request = require('request')
const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('Creating a new resource', () => {
    it('errors with invalid type', done => {
      const data = {
        method: 'post',
        url: 'http://localhost:16006/rest/foobar'
      }
      helpers.request(data, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '404', 'Expecting 404')

        done()
      })
    })

    it('errors if resource doesnt validate', done => {
      const data = {
        method: 'post',
        url: 'http://localhost:16006/rest/articles',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': {
            'type': 'photos',
            'attributes': { },
            'relationships': { }
          }
        })
      }
      request(data, (err, res, json) => {
        assert.equal(err, null)
        json = helpers.validateError(json)
        assert.equal(json.errors[0].detail.length, 2, 'Expecting several validation errors')
        assert.equal(res.statusCode, '403', 'Expecting 403')

        done()
      })
    })

    it('errors if content-type specifies a media type parameter', done => {
      const data = {
        method: 'post',
        url: 'http://localhost:16006/rest/photos',
        headers: {
          'Content-Type': 'application/vnd.api+json;foobar'
        },
        body: JSON.stringify({
          'data': { }
        })
      }
      request(data, (err, res) => {
        assert.equal(err, null)
        assert.equal(res.statusCode, '415', 'Expecting 415')

        done()
      })
    })

    it('errors if accept header doesnt match JSON:APIs type', done => {
      const data = {
        method: 'post',
        url: 'http://localhost:16006/rest/photos',
        headers: {
          'Accept': 'application/vnd.api+xml, application/vnd.api+json;foobar, text/json'
        },
        body: JSON.stringify({
          'data': { }
        })
      }
      request(data, (err, res) => {
        assert.equal(err, null)
        assert.equal(res.statusCode, '406', 'Expecting 406')

        done()
      })
    })

    it('errors if no body is detected', done => {
      const data = {
        method: 'post',
        url: 'http://localhost:16006/rest/photos'
      }
      request(data, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '403', 'Expecting 403')

        done()
      })
    })

    it('errors if body.data is not an object', done => {
      const data = {
        method: 'post',
        // IMPORTANT: we're using people here because it has no required attributes.
        // note that if data comes in as a string, then the value of the string
        // is discarded and an empty people object would be created, which is
        // likely not what the developer of the api client would have intended.
        url: 'http://localhost:16006/rest/people',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        // some api/curl clients fail to fully serialize hashes/dictionaries
        // if their encoding and Content-Type is not properly set.  In that
        // case, you end up with something like this (yes, I'm
        // looking at you, python!)
        body: JSON.stringify({
          'data': 'attributes'
        })
      }
      request(data, (err, res, json) => {
        assert.equal(err, null)
        json = helpers.validateError(json)
        assert.equal(res.statusCode, '403', 'Expecting 403')
        // we're checking the deep equal of errors here in case
        // someone makes a field on people required, or changes
        // the resource used on this test to a resource that
        // has a required field.  With this check, this will
        // continue to work properly even if that happens; however,
        // ideally, this test should be run against a resource
        // with NO required fields.
        assert.deepEqual(json.errors, [
          {
            'code': 'EFORBIDDEN',
            'detail': '"data" must be an object - have you sent the right http headers?',
            'status': '403',
            'title': 'Request validation failed'
          }
        ])
        done()
      })
    })

    describe('creates a resource', () => {
      let id

      it('works', done => {
        const data = {
          method: 'post',
          url: 'http://localhost:16006/rest/photos',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'type': 'photos',
              'attributes': {
                'title': 'Ember Hamster',
                'url': 'http://example.com/images/productivity.png',
                'height': 512,
                'width': 1024
              },
              'relationships': {
                'photographer': {
                  'data': { 'type': 'people', 'id': 'cc5cca2e-0dd8-4b95-8cfc-a11230e73116' }
                }
              },
              'meta': {
                'created': '2015-01-01'
              }
            }
          })
        }
        helpers.request(data, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)

          assert.equal(res.headers.location, `http://localhost:16006/rest/photos/${json.data.id}`)
          assert.equal(res.statusCode, '201', 'Expecting 201')
          assert.equal(json.data.type, 'photos', 'Should be a people resource')
          helpers.validatePhoto(json.data)
          id = json.data.id

          done()
        })
      })

      it('new resource is retrievable', done => {
        const url = `http://localhost:16006/rest/photos/${id}`
        helpers.request({
          method: 'GET',
          url
        }, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200 OK')
          assert.equal(json.included.length, 0, 'Should be no included resources')
          helpers.validatePhoto(json.data)
          assert.deepEqual(json.data.meta, { created: '2015-01-01' })

          done()
        })
      })
      describe('creates a resource with non-UUID ID', () => {
        let id

        it('works', done => {
          const data = {
            method: 'post',
            url: 'http://localhost:16006/rest/autoincrement',
            headers: {
              'Content-Type': 'application/vnd.api+json'
            },
            body: JSON.stringify({
              'data': {
                'type': 'autoincrement',
                'attributes': {
                  'name': 'bar'
                }
              }
            })
          }
          helpers.request(data, (err, res, json) => {
            assert.equal(err, null)
            json = helpers.validateJson(json)

            assert.equal(json.data.id, '2')
            assert.equal(res.headers.location, `http://localhost:16006/rest/autoincrement/${json.data.id}`)
            assert.equal(res.statusCode, '201', 'Expecting 201')
            assert.equal(json.data.type, 'autoincrement', 'Should be a autoincrement resource')
            id = json.data.id

            done()
          })
        })

        it('new resource is retrievable', done => {
          const url = `http://localhost:16006/rest/autoincrement/${id}`
          helpers.request({
            method: 'GET',
            url
          }, (err, res, json) => {
            assert.equal(err, null)
            json = helpers.validateJson(json)
            assert.equal(res.statusCode, '200', 'Expecting 200 OK')
            assert.equal(json.included.length, 0, 'Should be no included resources')
            done()
          })
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
