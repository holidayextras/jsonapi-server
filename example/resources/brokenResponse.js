'use strict'

const jsonApi = require('../../.')
const brokenResponseHandler = require('../handlers/brokenResponseHandler.js')

jsonApi.define({
  namespace: 'json:api',
  resource: 'brokenResponse',
  description: 'Example demonstrating error handling of broken responses',
  handlers: brokenResponseHandler,
  searchParams: { },
  attributes: {
    boolean: jsonApi.Joi.boolean(),
    number: jsonApi.Joi.number()
  },
  examples: [
    {
      id: 'b3ea78f4-8d03-4708-9945-d58cadc97b04',
      type: 'brokenResponse',
      boolean: true,
      number: 3
    }
  ]
})
