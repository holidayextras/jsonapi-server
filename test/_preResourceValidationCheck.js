const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  [ { name: 'articles', count: 4 },
    { name: 'comments', count: 3 },
    { name: 'people', count: 4 },
    { name: 'photos', count: 4 },
    { name: 'tags', count: 5 }
  ].forEach(resource => {
    describe(`Searching for ${resource.name}`, () => {
      it(`should find ${resource.count}`, done => {
        const url = `http://localhost:16006/rest/${resource.name}`
        helpers.request({
          method: 'GET',
          url
        }, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)
          assert.equal(json.data.length, resource.count, `Expected ${resource.count} resources`)
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
