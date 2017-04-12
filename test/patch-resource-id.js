const assert = require('assert')
const request = require('request')
const helpers = require('./helpers.js')
const jsonApiTestServer = require('../example/server.js')

describe('Testing jsonapi-server', () => {
  describe('Updating a resource', () => {
    context('with invalid urls', () => {
      it('errors with invalid type', done => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16006/rest/foobar/someId'
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
          method: 'patch',
          url: 'http://localhost:16006/rest/comments/foobar',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'test': 123
            }
          })
        }
        request(data, (err, res, json) => {
          assert.equal(err, null)
          helpers.validateError(json)
          assert.equal(res.statusCode, '404', 'Expecting 404')

          done()
        })
      })
    })

    context('with invalid payloads', () => {
      it('errors with invalid attributes', done => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'attributes': {
                'timestamp': 'foobar-date'
              }
            }
          })
        }
        request(data, (err, res, json) => {
          assert.equal(err, null)
          helpers.validateError(json)
          assert.equal(res.statusCode, '403', 'Expecting 403')

          done()
        })
      })

      it('errors with invalid one relations', done => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16006/rest/articles/d850ea75-4427-4f81-8595-039990aeede5',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'relationships': {
                'author': {
                  'data': { 'foo': 'bar' }
                }
              }
            }
          })
        }
        request(data, (err, res, json) => {
          assert.equal(err, null)
          helpers.validateError(json)
          assert.equal(res.statusCode, '403', 'Expecting 403')

          done()
        })
      })

      it('errors with invalid many relations 1', done => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16006/rest/articles/d850ea75-4427-4f81-8595-039990aeede5',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'relationships': {
                'tags': {
                  'data': [ undefined ]
                }
              }
            }
          })
        }
        helpers.request(data, (err, res, json) => {
          assert.equal(err, null)
          helpers.validateError(json)
          assert.equal(res.statusCode, '403', 'Expecting 403')

          done()
        })
      })

      it('errors with invalid many relations 2', done => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16006/rest/articles/d850ea75-4427-4f81-8595-039990aeede5',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'relationships': {
                'tags': {
                  'data': [ { 'type': 'tags', 'id': '2a3bdea4-a889-480d-b886-104498c86f69' }, undefined ]
                }
              }
            }
          })
        }
        helpers.request(data, (err, res, json) => {
          assert.equal(err, null)
          helpers.validateError(json)
          assert.equal(res.statusCode, '403', 'Expecting 403')

          done()
        })
      })
    })

    it('only validates named attributes', done => {
      const data = {
        method: 'patch',
        url: 'http://localhost:16006/rest/articles/d850ea75-4427-4f81-8595-039990aeede5',
        headers: {
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify({
          'data': {
            'attributes': {
              'title': 'How to use AWS'
              // content, a required attribute, is missing.
            }
          }
        })
      }
      request(data, (err, res, json) => {
        assert.equal(err, null)
        helpers.validateJson(json)

        assert.equal(res.statusCode, '200', 'Expecting 200')

        done()
      })
    })

    describe('updating a comment', () => {
      it('updates the resource', done => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'attributes': {
                'timestamp': '2017-06-29'
              },
              'relationships': {
                'author': {
                  'data': { 'type': 'people', 'id': 'd850ea75-4427-4f81-8595-039990aeede5' }
                }
              },
              'meta': {
                'created': '2013-01-01'
              }
            }
          })
        }
        request(data, (err, res, json) => {
          assert.equal(err, null)
          helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')

          done()
        })
      })

      it('new resource has changed', done => {
        const url = 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb'
        helpers.request({
          method: 'GET',
          url
        }, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')

          assert.deepEqual(json.data, {
            'type': 'comments',
            'id': '3f1a89c2-eb85-4799-a048-6735db24b7eb',
            'attributes': {
              'body': 'I like XML better',
              'timestamp': '2017-06-29'
            },
            'links': {
              'self': 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb'
            },
            'relationships': {
              'author': {
                'meta': {
                  'relation': 'primary',
                  'readOnly': false
                },
                'links': {
                  'self': 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/relationships/author',
                  'related': 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/author'
                },
                'data': {
                  'type': 'people',
                  'id': 'd850ea75-4427-4f81-8595-039990aeede5'
                }
              },
              'article': {
                'meta': {
                  'relation': 'foreign',
                  'belongsTo': 'articles',
                  'as': 'comments',
                  'readOnly': true,
                  'many': false
                },
                'links': {
                  'self': 'http://localhost:16006/rest/articles/relationships/?comments=3f1a89c2-eb85-4799-a048-6735db24b7eb',
                  'related': 'http://localhost:16006/rest/articles/?filter[comments]=3f1a89c2-eb85-4799-a048-6735db24b7eb'
                }
              }
            },
            'meta': {
              'created': '2013-01-01'
            }
          })

          done()
        })
      })

      it('deletes a relationship', done => {
        const data = {
          method: 'patch',
          url: 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb',
          headers: {
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            'data': {
              'attributes': {
                'timestamp': '2017-06-29'
              },
              'relationships': {
                'author': {
                  'data': null
                }
              },
              'meta': {
                'created': '2013-01-01'
              }
            }
          })
        }
        request(data, (err, res, json) => {
          assert.equal(err, null)
          helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')

          done()
        })
      })

      it('new resource has changed', done => {
        const url = 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb'
        helpers.request({
          method: 'GET',
          url
        }, (err, res, json) => {
          assert.equal(err, null)
          json = helpers.validateJson(json)

          assert.equal(res.statusCode, '200', 'Expecting 200')

          assert.deepEqual(json.data, {
            'type': 'comments',
            'id': '3f1a89c2-eb85-4799-a048-6735db24b7eb',
            'attributes': {
              'body': 'I like XML better',
              'timestamp': '2017-06-29'
            },
            'links': {
              'self': 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb'
            },
            'relationships': {
              'author': {
                'meta': {
                  'relation': 'primary',
                  'readOnly': false
                },
                'links': {
                  'self': 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/relationships/author',
                  'related': 'http://localhost:16006/rest/comments/3f1a89c2-eb85-4799-a048-6735db24b7eb/author'
                },
                'data': null
              },
              'article': {
                'meta': {
                  'relation': 'foreign',
                  'belongsTo': 'articles',
                  'as': 'comments',
                  'readOnly': true,
                  'many': false
                },
                'links': {
                  'self': 'http://localhost:16006/rest/articles/relationships/?comments=3f1a89c2-eb85-4799-a048-6735db24b7eb',
                  'related': 'http://localhost:16006/rest/articles/?filter[comments]=3f1a89c2-eb85-4799-a048-6735db24b7eb'
                }
              }
            },
            'meta': {
              'created': '2013-01-01'
            }
          })

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
