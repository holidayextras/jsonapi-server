
const rerouter = require('../lib/rerouter')
const assert = require('assert')

describe('lib.rerouter', function () {
  describe('_mergeParams', function () {
    it('should short circuit with a clone when faced with nulls (objA)', function () {
      let input = { b: 'b' }
      let out = rerouter._mergeParams(null, input)
      assert.deepStrictEqual(input, out)
      assert.notEqual(input, out)
    })

    it('should short circuit with a clone when faced with nulls (objB)', function () {
      let input = {a: 'a'}
      let out = rerouter._mergeParams(input, null)
      assert.deepStrictEqual(input, out)
      assert.notEqual(input, out)
    })

    it('should merge arrays', function () {
      let inputA = [ 'a' ]
      let inputB = [ 'b' ]

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, [ 'a', 'b' ])
    })

    it('should exclude null and undefined from arrays', function () {
      let inputA = [ 'a', null, undefined ]
      let inputB = [ 'b' ]

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, [ 'a', 'b' ])
    })

    it('should NOT exclude falsy values from arrays', function () {
      let inputA = [ 'a', 0, '' ]
      let inputB = [ 'b' ]

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, [ 'a', 0, '', 'b' ])
    })

    it('should combine values from arrays', function () {
      let inputA = [ 'a', 'b' ]
      let inputB = [ 'b', 'c' ]

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, [ 'a', 'b', 'c' ])
    })

    it('should combine single values and arrays', function () {
      let inputA = [ 'a', 'b' ]
      let inputB = 'c'

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, [ 'a', 'b', 'c' ])
    })

    it('should combine two unique values into an array', function () {
      let inputA = 'a'
      let inputB = 'b'

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, [ 'a', 'b' ])
    })

    it('should combine two identical values into a single value', function () {
      let inputA = 'a'
      let inputB = 'a'

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, 'a')
    })

    it('should reduce a single element array into a single value', function () {
      let inputA = [ 'a' ]
      let inputB = [ 'a' ]

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, 'a')
    })

    it('should work on objects with the same keys', function () {
      let inputA = { a: 'a' }
      let inputB = { a: 'b' }

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, { a: [ 'a', 'b' ] })
    })

    it('should work on objects with objA having more keys', function () {
      let inputA = { a: 'a', b: 'c' }
      let inputB = { a: 'b' }

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, { a: [ 'a', 'b' ], b: 'c' })
    })

    it('should work on objects with objB having more keys', function () {
      let inputA = { a: 'a' }
      let inputB = { a: 'b', b: 'c' }

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, { a: [ 'a', 'b' ], b: 'c' })
    })

    it('should work recursively on objects', function () {
      let inputA = { a: 'a', b: { c: [ 'a', 'b' ], e: 'e', f: 'f' } }
      let inputB = { a: 'b', b: { c: 'c', d: 'd', f: 'f' } }

      let out = rerouter._mergeParams(inputA, inputB)
      assert.deepStrictEqual(out, { a: [ 'a', 'b' ], b: { c: [ 'a', 'b', 'c' ], d: 'd', e: 'e', f: 'f' } })
    })
  })
})
