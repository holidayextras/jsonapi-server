/* @flow weak */
'use strict'
var jsonApiGraphQL = module.exports = { }

var jsonApi = require('../../')
var graphqlHTTP = require('express-graphql')
var graphQl = require('graphql')

var resolvers = require('./resolvers.js')
var filterArgs = require('./filterArgs.js')
var readTypes = require('./readTypes.js')
var writeTypes = require('./writeTypes.js')

jsonApiGraphQL.with = function (app) {
  var config = jsonApi._apiConfig.graphQl
  if (!config) return

  app.use(config.path, graphqlHTTP({
    schema: jsonApiGraphQL.generate(jsonApi._resources),
    graphiql: !!config.graphiql
  }))
}

jsonApiGraphQL.generate = function (allResourceConfig) {
  var allReadTypes = readTypes.generate(allResourceConfig)
  var readSchema = jsonApiGraphQL.generateReadSchema(allReadTypes, allResourceConfig)

  var allWriteTypes = writeTypes.generate(allResourceConfig, allReadTypes)
  var writeSchema = jsonApiGraphQL.generateWriteSchema(allReadTypes, allResourceConfig, allWriteTypes)

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

jsonApiGraphQL.generateReadSchema = function (allReadTypes, allResourceConfig) {
  var result = { }

  Object.keys(allResourceConfig).forEach(function (resource) {
    var resourceConfig = allResourceConfig[resource]

    result[resourceConfig.resource] = {
      description: 'Get some ' + resourceConfig.resource + ' resources',
      args: filterArgs.generate(resource),
      type: new graphQl.GraphQLList(allReadTypes[resource]),
      resolve: resolvers.search.bind(resolvers, resourceConfig, null)
    }
  })
  return result
}

jsonApiGraphQL.generateWriteSchema = function (allReadTypes, allResourceConfig, allWriteTypes) {
  var result = { }

  Object.keys(allResourceConfig).forEach(function (resource) {
    var resourceConfig = allResourceConfig[resource]

    var uName = resourceConfig.resource
    uName = uName[0].toUpperCase() + uName.substring(1)

    var args = { }
    args[resourceConfig.resource] = {
      type: allWriteTypes[resource]
    }

    result['create' + uName] = {
      description: 'Create a new ' + resourceConfig.resource + ' resource',
      args: args,
      type: allReadTypes[resource],
      resolve: resolvers.create.bind(resolvers, resourceConfig)
    }

    result['update' + uName] = {
      description: 'Update an existing ' + resourceConfig.resource + ' resource',
      args: args,
      type: allReadTypes[resource],
      resolve: resolvers.update.bind(resolvers, resourceConfig)
    }

    result['delete' + uName] = {
      description: 'Delete a ' + resourceConfig.resource + ' resource',
      args: {
        id: { type: new graphQl.GraphQLNonNull(graphQl.GraphQLString) }
      },
      type: allReadTypes[resource],
      resolve: resolvers.delete.bind(resolvers, resourceConfig)
    }
  })
  return result
}
