'use strict'
const jsonApiGraphQL = module.exports = { }

const jsonApi = require('../../')
const graphqlHTTP = require('express-graphql')
const graphQl = require('graphql')

const resolvers = require('./resolvers.js')
const filterArgs = require('./filterArgs.js')
const readTypes = require('./readTypes.js')
const writeTypes = require('./writeTypes.js')

jsonApiGraphQL.with = app => {
  const config = jsonApi._apiConfig

  if (config.graphiql !== false) {
    app.use(new RegExp(`${config.base}$`), graphqlHTTP({
      schema: jsonApiGraphQL.generate(jsonApi._resources),
      graphiql: !!config.graphiql
    }))
  }
}

jsonApiGraphQL.generate = allResourceConfig => {
  const allReadTypes = readTypes.generate(allResourceConfig)
  const readSchema = jsonApiGraphQL.generateReadSchema(allReadTypes, allResourceConfig)

  const allWriteTypes = writeTypes.generate(allResourceConfig, allReadTypes)
  const writeSchema = jsonApiGraphQL.generateWriteSchema(allReadTypes, allResourceConfig, allWriteTypes)

  return new graphQl.GraphQLSchema({
    query: new graphQl.GraphQLObjectType({
      name: 'RootQueryType',
      fields: readSchema
    }),
    mutation: new graphQl.GraphQLObjectType({
      name: 'RootMutationType',
      fields: writeSchema
    })
  })
}

jsonApiGraphQL.generateReadSchema = (allReadTypes, allResourceConfig) => {
  const result = { }

  Object.keys(allResourceConfig).forEach(resource => {
    const resourceConfig = allResourceConfig[resource]

    result[resourceConfig.resource] = {
      description: `Get some ${resourceConfig.resource} resources`,
      args: filterArgs.generate(resource),
      type: new graphQl.GraphQLList(allReadTypes[resource]),
      resolve: resolvers.search.bind(resolvers, resourceConfig, null)
    }
  })
  return result
}

jsonApiGraphQL.generateWriteSchema = (allReadTypes, allResourceConfig, allWriteTypes) => {
  const result = { }

  Object.keys(allResourceConfig).forEach(resource => {
    const resourceConfig = allResourceConfig[resource]

    let uName = resourceConfig.resource
    uName = uName[0].toUpperCase() + uName.substring(1)

    const args = { }
    args[resourceConfig.resource] = {
      type: allWriteTypes[resource]
    }

    result[`create${uName}`] = {
      description: `Create a new ${resourceConfig.resource} resource`,
      args,
      type: allReadTypes[resource],
      resolve: resolvers.create.bind(resolvers, resourceConfig)
    }

    result[`update${uName}`] = {
      description: `Update an existing ${resourceConfig.resource} resource`,
      args,
      type: allReadTypes[resource],
      resolve: resolvers.update.bind(resolvers, resourceConfig)
    }

    result[`delete${uName}`] = {
      description: `Delete a ${resourceConfig.resource} resource`,
      args: {
        id: { type: new graphQl.GraphQLNonNull(graphQl.GraphQLString) }
      },
      type: allReadTypes[resource],
      resolve: resolvers.delete.bind(resolvers, resourceConfig)
    }
  })
  return result
}
