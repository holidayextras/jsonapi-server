const jsonApi = require('../../.')
const tupleHandler = require('../handlers/tupleHandler.js')

jsonApi.define({
  namespace: 'json:api',
  resource: 'tuples',
  description: 'A demonstration of a polymorphic relationship',
  handlers: tupleHandler,
  searchParams: { },
  attributes: {
    media: jsonApi.Joi.many('articles', 'photos'),
    preferred: jsonApi.Joi.one('articles', 'photos')
  },
  examples: [
    {
      id: 'fbaefe1b-8b80-42c2-b17c-0c397e5b7a0b',
      type: 'tuples',
      media: [
        { type: 'articles', id: 'fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5' },
        { type: 'photos', id: '72695cbd-e9ef-44f6-85e0-0dbc06a269e8' }
      ],
      preferred: { type: 'articles', id: 'fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5' }
    },
    {
      id: '53e4151d-d47d-4188-be22-2b3a290f6690',
      type: 'tuples',
      media: [
        { type: 'articles', id: 'd850ea75-4427-4f81-8595-039990aeede5' },
        { type: 'photos', id: '4a8acd65-78bb-4020-b9eb-2d058a86a2a0' }
      ],
      preferred: { type: 'photos', id: '72695cbd-e9ef-44f6-85e0-0dbc06a269e8' }
    }
  ]
})
