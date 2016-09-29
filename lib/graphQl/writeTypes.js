'use strict'
const writeTypes = module.exports = { }

const graphQl = require('graphql')
const writeArgs = require('./writeArgs.js')

writeTypes.generate = allResourceConfig => {
  const allWriteTypes = { }
  Object.keys(allResourceConfig).forEach(resource => {
    allWriteTypes[resource] = writeTypes.createWriteType(allResourceConfig[resource], allWriteTypes)
  })
  return allWriteTypes
}

writeTypes.createWriteType = (resourceConfig, allWriteTypes) => {
  const someType = {
    name: `${resourceConfig.resource}Write`,
    description: resourceConfig.description,
    fields () {
      return writeArgs.generate(resourceConfig.resource, allWriteTypes)
    }
  }

  return new graphQl.GraphQLInputObjectType(someType)
}
