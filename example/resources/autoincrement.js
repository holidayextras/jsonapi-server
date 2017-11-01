'use strict'

const jsonApi = require('../../.')
const autoincrementHandler = require('../handlers/autoincrementHandler.js')

jsonApi.define({
  namespace: 'json:api',
  resource: 'autoincrement',
  description: 'Demonstration of a resource with an auto-incrementing ID',
  handlers: autoincrementHandler,
  searchParams: { },
  generateId: false,
  attributes: {
    id: jsonApi.Joi.string(),
    name: jsonApi.Joi.string()
      .description('The name of the item')
      .example('Hello')
  },
  examples: [
    {
      id: '1',
      type: 'autoincrement',
      name: 'Foo'
    }
  ]
})
