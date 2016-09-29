'use strict'
const writeArgs = module.exports = { }

const graphQl = require('graphql')
const jsonApi = require('../..')
const joiConverter = require('./joiConverter.js')

writeArgs.generate = (resource, allWriteTypes) => {
  const args = {
    id: { type: graphQl.GraphQLString }
  }
  const resourceConfig = jsonApi._resources[resource]
  Object.keys(resourceConfig.attributes).forEach(attribute => {
    if ((attribute === 'id') || (attribute === 'type') || (attribute === 'meta')) return

    const joiScheme = resourceConfig.attributes[attribute]
    if (joiScheme._settings && joiScheme._settings.__as) return

    args[attribute] = {
      type: joiConverter.shallowInput(joiScheme, allWriteTypes),
      description: joiScheme._description
    }
  })
  return args
}
