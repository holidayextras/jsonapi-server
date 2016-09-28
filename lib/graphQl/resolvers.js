/* @flow weak */
'use strict'
var resolvers = module.exports = { }

var _ = {
  assign: require('lodash.assign')
}
var rerouter = require('../rerouter.js')
var jsonApi = require('../..')

resolvers.search = function (resourceConfig, attribute, parent, args, req, ast) {
  var path
  // If we don't have a JSON:API resource, go get it
  if (!parent) {
    path = jsonApi._apiConfig.pathPrefix + resourceConfig.resource
    return resolvers.rerouteTo('GET', path, { }, req, ast)
  }
  // Simple attributes can be plucked from the JSON:API resource
  if (!resourceConfig.attributes[attribute]._settings) {
    return parent.attributes[attribute]
  }
  // Related resources need to be requested via the related link
  path = parent.relationships[attribute].links.related
  return resolvers.rerouteTo('GET', path, { }, req, ast)
}

resolvers.create = function (resourceConfig, parent, args, req, ast) {
  var path = jsonApi._apiConfig.pathPrefix + resourceConfig.resource
  var data = resolvers.generateResourceFromArgs(args, resourceConfig)
  return resolvers.rerouteTo('POST', path, { data: data }, req, ast)
}

resolvers.update = function (resourceConfig, parent, args, req, ast) {
  var path = jsonApi._apiConfig.pathPrefix + resourceConfig.resource + '/' + args.tags.id
  var data = resolvers.generateResourceFromArgs(args, resourceConfig)
  return resolvers.rerouteTo('PATCH', path, { data: data }, req, ast)
}

resolvers.delete = function (resourceConfig, parent, args, req, ast) {
  var path = jsonApi._apiConfig.pathPrefix + resourceConfig.resource + '/' + args.id
  var resource
  return resolvers.rerouteTo('GET', path, { }, req, ast)
    .then(function (originalResource) {
      resource = originalResource
      return resolvers.rerouteTo('DELETE', path, { }, req, ast)
    }).then(function () {
      return resource
    })
}

resolvers.rerouteTo = function (method, path, args, req, ast) {
  return new Promise(function (resolve, reject) {
    rerouter.route({
      method: method,
      uri: path,
      params: _.assign({
        fields: resolvers.generateFieldsQueryFromAst(ast),
        filter: resolvers.generateFilterQueryFromAst(ast)
      }, args),
      originalRequest: {
        headers: req.headers || { },
        cookies: req.cookies || { }
      }
    }, function (err, json) {
      if (err) return reject(err.errors.map(function (e) { return e.detail }))
      resolve(json.data)
    })
  })
}

resolvers.generateResourceFromArgs = function (args, resourceConfig) {
  if ((Object.keys(args).length === 1) && (args[resourceConfig.resource])) {
    args = args[resourceConfig.resource]
  }

  var data = {
    type: resourceConfig.resource,
    attributes: { },
    relationships: { }
  }

  Object.keys(resourceConfig.attributes).forEach(function (attribute) {
    var joiSchema = resourceConfig.attributes[attribute]
    if (!args[attribute]) return
    if (!joiSchema._settings) {
      data.attributes[attribute] = args[attribute]
    } else {
      data.relationships[attribute] = {
        data: args[attribute]
      };
      [].concat(data.relationships[attribute].data).forEach(function (relation) {
        relation.type = joiSchema._settings.__one || joiSchema._settings.__many
      })
    }
  })

  return data
}

resolvers.generateFieldsQueryFromAst = function (ast) {
  var arrays = (ast.fieldASTs || []).map(function (fieldAST) {
    return fieldAST.selectionSet.selections || [ ]
  })
  var combined = [].concat.apply([], arrays)
  var fields = []
  combined.forEach(function (thing) {
    fields.push(thing.name.value)
  })
  fields = fields.join(',')
  return fields
}

resolvers.generateFilterQueryFromAst = function (ast) {
  var arrays = (ast.fieldASTs || []).map(function (fieldAST) {
    return fieldAST.arguments || [ ]
  })
  var combined = [].concat.apply([], arrays)
  var filter = { }
  combined.forEach(function (thing) {
    filter[thing.name.value] = thing.value.value
  })
  return filter
}
