const readTypes = module.exports = { }

const graphQl = require('graphql')
const joiConverter = require('./joiConverter.js')
const resolvers = require('./resolvers.js')
const filterArgs = require('./filterArgs.js')

readTypes.generate = allResourceConfig => {
  const allReadTypes = { }
  Object.keys(allResourceConfig).forEach(resource => {
    allReadTypes[resource] = readTypes.createReadType(allResourceConfig[resource], allReadTypes)
  })
  return allReadTypes
}

readTypes.createReadType = (resourceConfig, otherTypes) => {
  const someType = {
    name: resourceConfig.resource,
    description: resourceConfig.description,
    args: filterArgs.generate(resourceConfig.resource),
    fields () {
      const fields = {
        id: {
          type: new graphQl.GraphQLNonNull(graphQl.GraphQLString),
          description: 'The UUID of the resource'
        }
      }

      Object.keys(resourceConfig.attributes).forEach(attribute => {
        if ((attribute === 'id') || (attribute === 'type') || (attribute === 'meta')) return

        const joiScheme = resourceConfig.attributes[attribute]
        fields[attribute] = {
          type: joiConverter.swap(joiScheme, otherTypes),
          description: joiScheme._description,
          resolve: resolvers.search.bind(resolvers, resourceConfig, attribute)
        }
        if (joiScheme._settings) {
          const otherResource = joiScheme._settings.__one || joiScheme._settings.__many
          fields[attribute].args = filterArgs.generate(otherResource)
        }
      })
      return fields
    }
  }

  return new graphQl.GraphQLObjectType(someType)
}
