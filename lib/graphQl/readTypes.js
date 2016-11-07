'use strict'
const readTypes = module.exports = { }

const graphQl = require('graphql')
const joiConverter = require('./joiConverter.js')
const resolvers = require('./resolvers.js')
const filterArgs = require('./filterArgs.js')
const UNION_JOIN_CONST = '_PluS_'
readTypes.UNION_JOIN_CONST = UNION_JOIN_CONST

readTypes.generate = allResourceConfig => {
  const allReadTypes = { }
  const allUnionTypes = [ ]
  Object.keys(allResourceConfig).forEach(resource => {
    allReadTypes[resource] = readTypes.createReadType(allResourceConfig[resource], allReadTypes, allUnionTypes)
  })
  allUnionTypes.forEach(unionType => {
    allReadTypes[unionType] = readTypes.createUnionType(unionType, allReadTypes)
  })
  return allReadTypes
}

readTypes.createReadType = (resourceConfig, otherTypes, allUnionTypes) => {
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
          if (otherResource.length === 1) {
            fields[attribute].args = filterArgs.generate(otherResource)
          }
        }
      })
      return fields
    }
  }

  Object.keys(resourceConfig.attributes).forEach(attribute => {
    const joiScheme = resourceConfig.attributes[attribute]
    if (!joiScheme._settings) return
    const otherResource = joiScheme._settings.__one || joiScheme._settings.__many
    if (otherResource.length <= 1) return
    const unionType = otherResource.join(UNION_JOIN_CONST)
    if (allUnionTypes.indexOf(unionType) !== -1) return
    allUnionTypes.push(unionType)
  })

  return new graphQl.GraphQLObjectType(someType)
}

readTypes.createUnionType = (unionType, allReadTypes) => {
  let graphQlTypes = unionType.split(UNION_JOIN_CONST).map(a => allReadTypes[a])
  return new graphQl.GraphQLUnionType({
    name: unionType,
    types: graphQlTypes,
    resolveType: function (value) {
      return graphQlTypes[unionType.split(UNION_JOIN_CONST).indexOf(value.type)]
    }
  })
}
