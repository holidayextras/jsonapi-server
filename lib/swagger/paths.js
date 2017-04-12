'use strict'
const swaggerPaths = module.exports = { }
const jsonApi = require('../../')
const _ = {
  uniq: require('lodash.uniq')
}

swaggerPaths.getPathDefinitions = () => {
  const paths = { }

  for (const resourceName in jsonApi._resources) {
    const resourceConfig = jsonApi._resources[resourceName]
    swaggerPaths._addPathDefinition(paths, resourceConfig)
  }

  return paths
}

swaggerPaths._addPathDefinition = (paths, resourceConfig) => {
  if (!paths || !resourceConfig) return undefined
  const resourceName = resourceConfig.resource

  swaggerPaths._addBasicPaths(paths, resourceName, resourceConfig)

  Object.keys(resourceConfig.attributes).filter(relationName => {
    let relation = resourceConfig.attributes[relationName]
    relation = relation._settings
    if (!relation || relation.__as) return false
    relation = (relation.__many || relation.__one)[0]
    return (jsonApi._resources[relation] && jsonApi._resources[relation].handlers.find)
  }).forEach(relationName => {
    let relation = resourceConfig.attributes[relationName]
    relation = (relation._settings.__one || relation._settings.__many)[0]

    swaggerPaths._addDeepPaths(paths, resourceName, resourceConfig, relationName, relation)
  })
}

swaggerPaths._addBasicPaths = (paths, resourceName, resourceConfig) => {
  const genericPaths = { }
  const specificPaths = { }
  paths[`/${resourceName}`] = genericPaths
  paths[`/${resourceName}/{id}`] = specificPaths

  if (resourceConfig.handlers.search) {
    genericPaths.get = swaggerPaths._getPathOperationObject({
      handler: 'search',
      resourceName,
      description: `Search for ${resourceName}`,
      parameters: resourceConfig.searchParams,
      hasPathId: false
    })
  }

  if (resourceConfig.handlers.create) {
    genericPaths.post = swaggerPaths._getPathOperationObject({
      handler: 'create',
      resourceName,
      description: `Create a new instance of ${resourceName}`,
      parameters: resourceConfig.attributes,
      hasPathId: false
    })
  }

  if (resourceConfig.handlers.find) {
    specificPaths.get = swaggerPaths._getPathOperationObject({
      handler: 'find',
      resourceName,
      description: `Get a specific instance of ${resourceName}`,
      hasPathId: true
    })
  }

  if (resourceConfig.handlers.delete) {
    specificPaths.delete = swaggerPaths._getPathOperationObject({
      handler: 'delete',
      resourceName,
      description: `Delete an instance of ${resourceName}`,
      hasPathId: true
    })
  }

  if (resourceConfig.handlers.update) {
    specificPaths.patch = swaggerPaths._getPathOperationObject({
      handler: 'update',
      resourceName,
      description: `Update an instance of ${resourceName}`,
      hasPathId: true
    })
  }
}

swaggerPaths._addDeepPaths = (paths, resourceName, resourceConfig, relationName, relation) => {
  if (resourceConfig.handlers.find) {
    paths[`/${resourceName}/{id}/${relationName}`] = {
      get: swaggerPaths._getPathOperationObject({
        handler: 'find',
        resourceName: relation,
        hasPathId: true
      })
    }
  }

  const relationType = resourceConfig.attributes[relationName]._settings.__many ? 'many' : 'one'
  const relationPaths = { }
  paths[`/${resourceName}/{id}/relationships/${relationName}`] = relationPaths

  if (resourceConfig.handlers.find) {
    relationPaths.get = swaggerPaths._getPathOperationObject({
      handler: 'find',
      resourceName: relation,
      relationType,
      extraTags: resourceName,
      hasPathId: true
    })
  }

  if (resourceConfig.handlers.update) {
    relationPaths.post = swaggerPaths._getPathOperationObject({
      handler: 'create',
      resourceName: relation,
      relationType,
      extraTags: resourceName,
      hasPathId: true
    })
  }

  if (resourceConfig.handlers.update) {
    relationPaths.patch = swaggerPaths._getPathOperationObject({
      handler: 'update',
      resourceName: relation,
      relationType,
      extraTags: resourceName,
      hasPathId: true
    })
  }

  if (resourceConfig.handlers.update) {
    relationPaths.delete = swaggerPaths._getPathOperationObject({
      handler: 'delete',
      resourceName: relation,
      relationType,
      extraTags: resourceName,
      hasPathId: true
    })
  }
}

swaggerPaths._getPathOperationObject = options => {
  const pathDefinition = {
    tags: [ options.resourceName ],
    description: options.description,
    parameters: [ ],
    responses: {
      '200': {
        description: `${options.resourceName} ${options.handler} response`,
        schema: {
          type: 'object',
          required: [ 'jsonapi', 'meta', 'links' ],
          properties: {
            jsonapi: {
              type: 'object',
              required: [ 'version' ],
              properties: {
                version: {
                  type: 'string'
                }
              }
            },
            meta: {
              type: 'object'
            },
            links: {
              type: 'object',
              required: [ 'self' ],
              properties: {
                self: {
                  type: 'string'
                },
                first: {
                  type: 'string'
                },
                last: {
                  type: 'string'
                },
                next: {
                  type: 'string'
                },
                prev: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      default: {
        description: 'Unexpected error',
        schema: {
          '$ref': '#/definitions/error'
        }
      }
    }
  }
  if (options.extraTags) {
    pathDefinition.tags = pathDefinition.tags.concat(options.extraTags)
    pathDefinition.tags = _.uniq(pathDefinition.tags)
  }

  const responseShortcut = pathDefinition.responses['200'].schema.properties
  responseShortcut.data = {
    '$ref': `#/definitions/${options.resourceName}`
  }

  if (options.handler === 'search') {
    responseShortcut.data = {
      type: 'array',
      items: responseShortcut.data
    }
  }
  if (((options.handler === 'search') || (options.handler === 'find')) && !options.relation) {
    pathDefinition.parameters = pathDefinition.parameters.concat(swaggerPaths._optionalJsonApiParameters())
    responseShortcut.included = {
      type: 'array',
      items: {
        type: 'object'
      }
    }
  }

  if ((options.handler === 'create') || (options.handler === 'update')) {
    const body = swaggerPaths._getBaseResourceModel(options.resourceName)
    if (options.relationType) {
      body.schema.properties.data = swaggerPaths._getRelationModel()
      if ((options.handler === 'update') && (options.relationType === 'many')) {
        body.schema.properties.data = {
          type: 'array',
          items: body.schema.properties.data
        }
      }
    }
    pathDefinition.parameters = pathDefinition.parameters.concat(body)
  }

  if (options.handler === 'delete' && options.relationType) {
    const body2 = swaggerPaths._getBaseResourceModel(options.resourceName)
    body2.schema.properties.data = swaggerPaths._getRelationModel()
    pathDefinition.parameters = pathDefinition.parameters.concat(body2)
  }

  if (options.handler === 'delete') {
    responseShortcut.data = undefined
  }

  if (options.handler === 'create') {
    pathDefinition.responses['201'] = pathDefinition.responses['200']
    pathDefinition.responses['200'] = undefined
  }

  if (options.hasPathId) {
    pathDefinition.parameters.push({
      name: 'id',
      in: 'path',
      description: 'id of specific instance to lookup',
      required: true,
      type: 'string'
    })
  }

  if (options.parameters) {
    const additionalParams = Object.keys(options.parameters).map(paramName => {
      const joiScheme = options.parameters[paramName]
      if ((paramName === 'id') || (paramName === 'type')) return null

      return {
        name: paramName,
        in: 'query',
        description: joiScheme._description || undefined,
        required: ((joiScheme._flags || { }).presence === 'required'),
        type: joiScheme._type
      }
    })
    pathDefinition.parameters.concat(additionalParams)
  }

  if (options.relationType) {
    responseShortcut.data = swaggerPaths._getRelationModel()
    if (options.relationType === 'many') {
      responseShortcut.data = {
        type: 'array',
        items: responseShortcut.data
      }
    }
  }

  return pathDefinition
}

swaggerPaths._optionalJsonApiParameters = () => [
  { '$ref': '#/parameters/sort' },
  { '$ref': '#/parameters/include' },
  { '$ref': '#/parameters/filter' },
  { '$ref': '#/parameters/fields' },
  { '$ref': '#/parameters/page' }
]

swaggerPaths._getRelationModel = () => ({
  type: 'object',
  required: [ 'type', 'id' ],

  properties: {
    type: {
      type: 'string'
    },
    id: {
      type: 'string'
    },
    meta: {
      type: 'object'
    }
  }
})

swaggerPaths._getBaseResourceModel = resourceName => ({
  in: 'body',
  name: 'body',
  description: 'New or partial resource',
  required: true,

  schema: {
    type: 'object',
    properties: {
      data: {
        '$ref': `#/definitions/${resourceName}`
      }
    }
  }
})
