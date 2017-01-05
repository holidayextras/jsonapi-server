const assert = require('assert')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing start & close return promises', ()=>{
  it('start', ()=>{
    let startPromise = jsonApiTestServer.start();
    assert.ok(startPromise, "No return value from start.");
    assert.equal(
      typeof startPromise.then, "function", "start() returned non-promise.");
    return startPromise.then(()=>{
      return jsonApiTestServer.close();
    });
  });
  it('close', ()=>{
    let startPromise = jsonApiTestServer.start();
    assert.ok(startPromise, "No return value from start.");
    assert.equal(
      typeof startPromise.then, "function", "start() returned non-promise.");
    return startPromise.then(()=>{
      return jsonApiTestServer.close();
    });   
  });
});