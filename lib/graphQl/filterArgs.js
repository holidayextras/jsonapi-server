'use strict'
const filterArgs = module.exports = { }

const graphQl = require('graphql')
const jsonApi = require('../..')

filterArgs.generate = resource => {
  const args = { }
  const resourceConfig = jsonApi._resources[resource]
  Object.keys(resourceConfig.attributes).forEach(attribute => {
    args[attribute] = {
      description: 'Filter string',
      type: graphQl.GraphQLString
    }
  })
  return args
}
