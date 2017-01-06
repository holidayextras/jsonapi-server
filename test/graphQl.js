const assert = require('assert')
const jsonApiTestServer = require('../example/server')

const Lokka = require('lokka').Lokka
const Transport = require('lokka-transport-http').Transport
const client = new Lokka({
  transport: new Transport('http://localhost:16006/rest/')
})

describe('Testing jsonapi-server graphql', () => {
  describe('read operations', () => {
    it('filter with primary join and filter', () => client.query(`
      {
        photos(width: "<1000") {
          url
          width
          tags
          photographer(firstname: "Rahul") {
            firstname
          }
        }
        articles(id:"de305d54-75b4-431b-adb2-eb6b9e546014") {
          nested {
            username
          }
          nesteds {
            password
          }
        }
      }
    `).then(result => {
      assert.deepEqual(result, {
        'photos': [
          {
            'url': 'http://www.example.com/penguins',
            'width': 60,
            'tags': ['galapagos', 'emperor'],
            'photographer': null
          },
          {
            'url': 'http://www.example.com/treat',
            'width': 350,
            'tags': ['black', 'green'],
            'photographer': {
              'firstname': 'Rahul'
            }
          }
        ],
        'articles': [
          {
            'nested': {
              'username': 'user1'
            },
            'nesteds': [
              {
                'password': 'qwerty'
              }
            ]
          }
        ]
      })
    }))

    it('filter with foreign join and filter', () => client.query(`
      {
        people(firstname: "Rahul") {
          firstname
          photos(width: "<1000") {
            url
            width
          }
        }
      }
    `).then(result => {
      assert.deepEqual(result, {
        'people': [
          {
            'firstname': 'Rahul',
            'photos': [
              {
                'url': 'http://www.example.com/treat',
                'width': 350
              }
            ]
          }
        ]
      })
    }))
  })

  describe('write operations', () => {
    let tagId = null

    it('create a tag', () => client.mutate(`
      {
        createTags(tags: {
          name: "test1"
          parent: {
            id: "7541a4de-4986-4597-81b9-cf31b6762486"
          }
          nesteds: [
            {
              password: "foobar"
            }
          ]
        }) {
          id
          name
          nesteds {
            password
          }
          parent {
            id
            name
          }
        }
      }
    `).then(result => {
      assert.equal(result.createTags.name, 'test1')
      console.log(result.createTags)
      assert.equal(result.createTags.nesteds[0].password, 'foobar')
      assert.equal(result.createTags.parent.id, '7541a4de-4986-4597-81b9-cf31b6762486')
      assert.equal(result.createTags.parent.name, 'live')
      tagId = result.createTags.id
    }))

    it('update the new tag', () => client.mutate(`
      {
        updateTags(tags: {
          id: "${tagId}"
          name: "test2"
          nesteds: [
            {
              password: "baz"
            }
          ]
          parent: {
            id: "68538177-7a62-4752-bc4e-8f971d253b42"
          }
        }) {
          id
          name
          nesteds {
            password
          }
          parent {
            id
            name
          }
        }
      }
    `).then(result => {
      assert.deepEqual(result, {
        updateTags: {
          id: tagId,
          name: 'test2',
          nesteds: [
            {
              password: 'baz'
            }
          ],
          parent: {
            id: '68538177-7a62-4752-bc4e-8f971d253b42',
            name: 'development'
          }
        }
      })
    }))

    it('deletes the tag', () => client.mutate(`
      {
        deleteTags(id: "${tagId}") {
          name
        }
      }
    `).then(result => {
      assert.deepEqual(result, {
        'deleteTags': {
          'name': 'test2'
        }
      })
    }))

    it('really is gone', () => client.query(`
      {
        tags(id: "${tagId}") {
          name
        }
      }
    `).then(result => {
      assert.deepEqual(result, {
        'tags': [ ]
      })
    }))
  })

  before(() => {
    jsonApiTestServer.start()
  })
  after(() => {
    jsonApiTestServer.close()
  })
})
