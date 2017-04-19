
const responseHelper = require('../lib/responseHelper')
const assert = require('assert')

describe('lib.responseHelper', function () {
  describe('_generateLink', function () {
    describe('__many', function () {
      let schemaProperty, linkProperty, item
      beforeEach(function () {
        item = {
          type: 'parent',
          id: 1,
          children: [
            { type: 'children', id: 2, meta: {}, attribute: 'test' }
          ]
        }
        linkProperty = 'children'
        schemaProperty = {
          _settings: { __many: [] }
        }
      })

      it('returns links for all children', function () {
        let actual = responseHelper._generateLink(item, schemaProperty, linkProperty)

        assert.deepStrictEqual(actual, {
          meta: {
            relation: 'primary',
            readOnly: false
          },
          links: {
            self: 'http://localhost:16006/rest/parent/1/relationships/children',
            related: 'http://localhost:16006/rest/parent/1/children'
          },
          data: [
            { type: 'children', id: 2, meta: {} }
          ]
        })
      })

      it('returns no data property when linkItems is undefined', function () {
        delete item.children
        let actual = responseHelper._generateLink(item, schemaProperty, linkProperty)

        assert.strictEqual(actual.data, undefined, 'Data must be undefined')
      })

      it('includes null data property when link item is null', function () {
        item.children = null
        let actual = responseHelper._generateLink(item, schemaProperty, linkProperty)

        assert.strictEqual(actual.data, null, 'Data must be null')
      })

      it('includes empty data property when link item is empty', function () {
        item.children = []
        let actual = responseHelper._generateLink(item, schemaProperty, linkProperty)

        assert.deepStrictEqual(actual.data, [], 'Data must be empty')
      })
    })

    describe('__one', function () {
      let schemaProperty, linkProperty, item
      beforeEach(function () {
        item = {
          type: 'parent',
          id: 1,
          child: { type: 'children', id: 2, meta: {}, attribute: 'test' }
        }
        linkProperty = 'child'
        schemaProperty = {
          _settings: { __one: [] }
        }
      })

      it('returns link for child', function () {
        let actual = responseHelper._generateLink(item, schemaProperty, linkProperty)

        assert.deepStrictEqual(actual, {
          meta: {
            relation: 'primary',
            readOnly: false
          },
          links: {
            self: 'http://localhost:16006/rest/parent/1/relationships/child',
            related: 'http://localhost:16006/rest/parent/1/child'
          },
          data: { type: 'children', id: 2, meta: {} }
        })
      })

      it('returns no data property when linkItem is undefined', function () {
        delete item.child
        let actual = responseHelper._generateLink(item, schemaProperty, linkProperty)

        assert.strictEqual(actual.data, undefined, 'Data must be undefined')
      })

      it('includes null data property when link item is null', function () {
        item.child = null
        let actual = responseHelper._generateLink(item, schemaProperty, linkProperty)

        assert.strictEqual(actual.data, null, 'Data must be null')
      })
    })
  })
})
