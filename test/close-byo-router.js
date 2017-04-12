const assert = require('assert')
const childProcess = require('child_process')
const path = require('path')

describe('Testing jsonapi-server with bring-your-own router', () => {
  const serverPath = path.join(__dirname, 'fixtures', 'server-byo-router.js')

  let child
  let isErrorEmitted
  let isExitEmitted
  let exitCode
  let exitSignal

  it('"exit" event, no "error" event', (done) => {
    setTimeout(() => {
      assert.equal(isExitEmitted, true)
      assert.equal(isErrorEmitted, false)
      done()
    }, 1000)
  })

  it('exit code is 0 (success)', () => {
    assert.equal(exitCode, 0)
    assert.equal(exitSignal, null)
  })

  before((done) => {
    child = null
    isErrorEmitted = false
    isExitEmitted = false
    exitCode = null

    child = childProcess.fork(serverPath, [], { stdio: 'inherit' })
    child.on('error', () => { isErrorEmitted = true })
    child.on('exit', (code, signal) => {
      exitCode = code
      exitSignal = signal
      isExitEmitted = true
      done()
    })
  })

  after(() => {
    if (child) {
      child.kill()
      child = null
    }
  })
})
