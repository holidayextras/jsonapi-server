const assert = require('assert')
const jsonApiTestServer = require('../example/server.js')

describe('Testing start & close return promises', () => {
  it('start', () => {
    const startPromise = jsonApiTestServer.start()
    assert.ok(startPromise, 'No return value from start.')
    assert.equal(
      typeof startPromise.then, 'function', 'start() returned non-promise.')
    return startPromise.then(() => {
      return jsonApiTestServer.close()
    })
  })
  it('close', () => {
    return jsonApiTestServer.start().then(() => {
      let closePromise = jsonApiTestServer.close()
      assert.ok('No return value from close.')
      assert.equal(
        typeof closePromise.then, 'function', 'close() returned non-promise.')
      return closePromise
    })
  })
})
