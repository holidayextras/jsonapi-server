'use strict'
const resolvers = module.exports = { }

const _ = {
  assign: require('lodash.assign')
}
const rerouter = require('../rerouter.js')
const jsonApi = require('../..')

resolvers.search = (resourceConfig, attribute, parent, args, req, ast) => {
  let path
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

resolvers.create = (resourceConfig, parent, args, req, ast) => {
  const path = jsonApi._apiConfig.pathPrefix + resourceConfig.resource
  const data = resolvers.generateResourceFromArgs(args, resourceConfig)
  return resolvers.rerouteTo('POST', path, { data }, req, ast)
}

resolvers.update = (resourceConfig, parent, args, req, ast) => {
  const path = `${jsonApi._apiConfig.pathPrefix + resourceConfig.resource}/${args.tags.id}`
  const data = resolvers.generateResourceFromArgs(args, resourceConfig)
  return resolvers.rerouteTo('PATCH', path, { data }, req, ast)
}

resolvers.delete = (resourceConfig, parent, args, req, ast) => {
  const path = `${jsonApi._apiConfig.pathPrefix + resourceConfig.resource}/${args.id}`
  let resource
  return resolvers.rerouteTo('GET', path, { }, req, ast)
    .then(originalResource => {
      resource = originalResource
      return resolvers.rerouteTo('DELETE', path, { }, req, ast)
    }).then(() => resource)
}

resolvers.rerouteTo = (method, path, args, req, ast) => new Promise((resolve, reject) => {
  rerouter.route({
    method,
    uri: path,
    params: _.assign({
      fields: resolvers.generateFieldsQueryFromAst(ast),
      filter: resolvers.generateFilterQueryFromAst(ast)
    }, args),
    originalRequest: {
      headers: req.headers || { },
      cookies: req.cookies || { }
    }
  }, (err, json) => {
    if (err) return reject(err.errors.map(e => e.detail))
    resolve(json.data)
  })
})

resolvers.generateResourceFromArgs = (args, resourceConfig) => {
  if ((Object.keys(args).length === 1) && (args[resourceConfig.resource])) {
    args = args[resourceConfig.resource]
  }

  const data = {
    type: resourceConfig.resource,
    attributes: { },
    relationships: { }
  }

  Object.keys(resourceConfig.attributes).forEach(attribute => {
    const joiSchema = resourceConfig.attributes[attribute]
    if (!args[attribute]) return
    if (!joiSchema._settings) {
      data.attributes[attribute] = args[attribute]
    } else {
      data.relationships[attribute] = {
        data: args[attribute]
      };
      [].concat(data.relationships[attribute].data).forEach(relation => {
        relation.type = (joiSchema._settings.__one || joiSchema._settings.__many)[0]
      })
    }
  })

  return data
}

resolvers.generateFieldsQueryFromAst = ast => {
  const arrays = (ast.fieldASTs || []).map(fieldAST => fieldAST.selectionSet.selections || [ ])
  const combined = [].concat.apply([], arrays)
  let fields = combined.map(thing => (thing.name || { }).value).filter(a => a)
  fields = fields.join(',')
  return fields
}

resolvers.generateFilterQueryFromAst = ast => {
  const arrays = (ast.fieldASTs || []).map(function (fieldAST) {
    return fieldAST.arguments || [ ]
  })
  const combined = [].concat.apply([], arrays)
  const filter = { }
  combined.forEach(thing => {
    filter[thing.name.value] = thing.value.value
  })
  return filter
}
