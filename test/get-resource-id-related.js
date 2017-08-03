'use strict'

const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('Finding a related resource', () => {
    it('unknown id should error', done => {
      const url = 'http://localhost:16006/rest/articles/foobar/author'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '404', 'Expecting 404')

        done()
      })
    })

    it('unknown relation should error', done => {
      const url = 'http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/foobar'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateError(json)
        assert.equal(res.statusCode, '404', 'Expecting 404')

        done()
      })
    })

    it('foreign relation should error', done => {
      const url = 'http://localhost:16006/rest/people/cc5cca2e-0dd8-4b95-8cfc-a11230e73116/articles'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.equal(err, null)
        json = helpers.validateError(json)
        assert.equal(json.errors[0].code, 'EFOREIGN')
        assert.equal(res.statusCode, '404', 'Expecting 404')

        done()
      })
    })

    it('Lookup by id', done => {
      const url = 'http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/author'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.equal(err, null)
        json = helpers.validateJson(json)

        assert.equal(res.statusCode, '200', 'Expecting 200 OK')
        helpers.validateResource(json.data)
        assert.equal(json.data.type, 'people', 'Should be a people resource')
        assert.strictEqual(json.meta.page, undefined, 'Pagination should be undefined')

        done()
      })
    })

    it('Lookup by id for 1:m', done => {
      const url = 'http://localhost:16006/rest/articles/1be0913c-3c25-4261-98f1-e41174025ed5/photos'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.equal(err, null)
        json = helpers.validateJson(json)

        assert.equal(res.statusCode, '200', 'Expecting 200 OK')
        json.data.forEach(resource => helpers.validateResource(resource))
        // technically, this should be 2... but it seems that the postProcess filtering does not correctly update the "total" as it filters records.
        // wondering if that should be fixed... (i.e. shouldn't totals be calculated AFTER filtering).
        assert.equal(json.meta.page && json.meta.page.total, 4, 'should include pagination')
        helpers.validatePagination(json)

        done()
      })
    })

    it('Lookup by id for 1:m paginated', done => {
      const url = 'http://localhost:16006/rest/articles/1be0913c-3c25-4261-98f1-e41174025ed5/photos?page[limit]=1'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.equal(err, null)
        json = helpers.validateJson(json)

        assert.equal(res.statusCode, '200', 'Expecting 200 OK')
        json.data.forEach(resource => helpers.validateResource(resource))
        // technically, this should be 2... but it seems that the MemoryHandler is not set up to filter correctly for these tests.
        // wondering if the postProcess filter should be updating the total as it applies its filters...
        // see "WARNING: Pagination count doesn't match resource count." in unit test output.
        assert.equal(json.meta.page && json.meta.page.total, 4, 'should include pagination')
        assert.equal(json.data.length, 1, 'only one record should be returned')
        helpers.validatePagination(json)

        done()
      })
    })

    it('with null data', done => {
      const url = 'http://localhost:16006/rest/comments/2f716574-cef6-4238-8285-520911af86c1/author'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.equal(err, null)
        json = helpers.validateJson(json)
        assert.equal(res.statusCode, '200', 'Expecting 200 OK')
        assert.strictEqual(json.data, null)
        assert(!('included' in json), "Null resource DON'T have `includes` attribute")

        done()
      })
    })

    it('with fields', done => {
      const url = 'http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/author?fields[people]=email'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.equal(err, null)
        json = helpers.validateJson(json)

        assert.equal(res.statusCode, '200', 'Expecting 200 OK')
        helpers.validateResource(json.data)
        const keys = Object.keys(json.data.attributes)
        assert.deepEqual(keys, [ 'email' ], 'Should only contain email attribute')

        done()
      })
    })

    it('with filter', done => {
      const url = 'http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/author?filter[email]=email@example.com'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.equal(err, null)
        json = helpers.validateJson(json)

        assert.equal(res.statusCode, '200', 'Expecting 200 OK')
        assert(!json.data)

        done()
      })
    })

    it('with includes', done => {
      const url = 'http://localhost:16006/rest/articles/de305d54-75b4-431b-adb2-eb6b9e546014/author?include=articles'
      helpers.request({
        method: 'GET',
        url
      }, (err, res, json) => {
        assert.equal(err, null)
        json = helpers.validateJson(json)

        assert.equal(res.statusCode, '200', 'Expecting 200 OK')
        assert.equal(json.included.length, 1, 'Should be 1 included resource')

        const people = json.included.filter(resource => resource.type === 'articles')
        assert.equal(people.length, 1, 'Should be 1 included articles resource')

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
