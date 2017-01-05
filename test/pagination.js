const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')
const pagination = require('../lib/pagination.js')

let pageLinks

describe('Testing jsonapi-server', () => {
  describe('pagination', () => {
    it('errors with invalid page parameters', done => {
      const data = {
        method: 'get',
        url: 'http://localhost:16006/rest/articles?page[size]=10'
      }
      helpers.request(data, (err, res) => {
        assert.equal(err, null)
        assert.equal(res.statusCode, '403', 'Expecting 403')

        done()
      })
    })

    describe('clicks through a full result set', () => {
      it('fetches the first page', done => {
        const data = {
          method: 'get',
          url: 'http://localhost:16006/rest/articles?page[offset]=0&page[limit]=1&sort=title'
        }
        helpers.request(data, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')
          assert.equal(json.meta.page.offset, 0, 'should be at offset 0')
          assert.equal(json.meta.page.limit, 1, 'should have a limit of 1 record')
          assert.equal(json.meta.page.total, 4, 'should have a total of 4 records')

          assert.equal(json.data[0].attributes.title, 'How to AWS', 'should be on the first article')

          assert.ok(Object.keys(json.links).length, 3, 'should have 3x links')
          assert.ok(json.links.last.match(/page%5Boffset%5D=3&page%5Blimit%5D=1/), 'last should target offset-3 limit-1')
          assert.ok(json.links.next.match(/page%5Boffset%5D=1&page%5Blimit%5D=1/), 'next should target offset-1 limit-1')

          pageLinks = json.links
          done()
        })
      })

      it('fetches the second page', done => {
        const data = {
          method: 'get',
          url: pageLinks.next
        }
        helpers.request(data, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')
          assert.equal(json.meta.page.offset, 1, 'should be at offset 0')
          assert.equal(json.meta.page.limit, 1, 'should have a limit of 1 record')
          assert.equal(json.meta.page.total, 4, 'should have a total of 4 records')

          assert.equal(json.data[0].attributes.title, 'Linux Rocks', 'should be on the second article')

          assert.ok(Object.keys(json.links).length, 5, 'should have 5x links')
          assert.ok(json.links.first.match(/page%5Boffset%5D=0&page%5Blimit%5D=1/), 'first should target offset-0 limit-1')
          assert.ok(json.links.last.match(/page%5Boffset%5D=3&page%5Blimit%5D=1/), 'last should target offset-3 limit-1')
          assert.ok(json.links.next.match(/page%5Boffset%5D=2&page%5Blimit%5D=1/), 'next should target offset-2 limit-1')
          assert.ok(json.links.prev.match(/page%5Boffset%5D=0&page%5Blimit%5D=1/), 'prev should target offset-0 limit-1')

          pageLinks = json.links
          done()
        })
      })

      it('fetches the third page', done => {
        const data = {
          method: 'get',
          url: pageLinks.next
        }
        helpers.request(data, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')
          assert.equal(json.meta.page.offset, 2, 'should be at offset 0')
          assert.equal(json.meta.page.limit, 1, 'should have a limit of 1 record')
          assert.equal(json.meta.page.total, 4, 'should have a total of 4 records')

          assert.equal(json.data[0].attributes.title, 'NodeJS Best Practices', 'should be on the first article')

          assert.ok(Object.keys(json.links).length, 5, 'should have 5x links')
          assert.ok(json.links.first.match(/page%5Boffset%5D=0&page%5Blimit%5D=1/), 'first should target offset-0 limit-1')
          assert.ok(json.links.last.match(/page%5Boffset%5D=3&page%5Blimit%5D=1/), 'last should target offset-3 limit-1')
          assert.ok(json.links.next.match(/page%5Boffset%5D=3&page%5Blimit%5D=1/), 'next should target offset-3 limit-1')
          assert.ok(json.links.prev.match(/page%5Boffset%5D=1&page%5Blimit%5D=1/), 'prev should target offset-1 limit-1')

          pageLinks = json.links
          done()
        })
      })

      it('fetches the final page', done => {
        const data = {
          method: 'get',
          url: pageLinks.next
        }
        helpers.request(data, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')
          assert.equal(json.meta.page.offset, 3, 'should be at offset 0')
          assert.equal(json.meta.page.limit, 1, 'should have a limit of 1 record')
          assert.equal(json.meta.page.total, 4, 'should have a total of 4 records')

          assert.equal(json.data[0].attributes.title, 'Tea for Beginners', 'should be on the fourth article')

          assert.ok(Object.keys(json.links).length, 3, 'should have 3x links')
          assert.ok(json.links.first.match(/page%5Boffset%5D=0&page%5Blimit%5D=1/), 'first should target offset-0 limit-1')
          assert.ok(json.links.prev.match(/page%5Boffset%5D=2&page%5Blimit%5D=1/), 'prev should target offset-2 limit-1')

          pageLinks = json.links
          done()
        })
      })
    })

    describe('correctly computes the last pages', done => {
      let page = {
        offset: 0,
        limit: 0
      }
      let request = {
        params: {
          page
        },
        route: {
          combined: ''
        }
      }

      it('with limit 4', () => {
        page.limit = 4
        let result = pagination.generatePageLinks(request, 16)
        assert.ok(result.last.match(/page%5Boffset%5D=12/), 'last should target offset=12')
      })

      it('with limit 5', () => {
        page.limit = 5
        let result = pagination.generatePageLinks(request, 16)
        assert.ok(result.last.match(/page%5Boffset%5D=15/), 'last should target offset=15')
      })

      it('with limit 6', () => {
        page.limit = 6
        let result = pagination.generatePageLinks(request, 16)
        assert.ok(result.last.match(/page%5Boffset%5D=12/), 'last should target offset=12')
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
