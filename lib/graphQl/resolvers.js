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

  let relation = parent.relationships[attribute]
  if (relation.meta.relation === 'primary') {
    let toFind = [].concat(relation.data)
    let expectedType = toFind[0].type
    toFind = toFind.map(i => i.id)
    let matches = req.included.filter(resource => {
      let sameType = (resource.type === expectedType)
      if (!sameType) return false
      return toFind.indexOf(resource.id) !== -1
    })
    if (relation.meta.many) return matches
    return matches[0]
  } else if (relation.meta.relation === 'foreign') {
    let idToMatch = parent.id
    let expectedType = relation.meta.belongsTo
    let relationName = relation.meta.as
    let matches = req.included.filter(resource => {
      let sameType = (resource.type === expectedType)
      if (!sameType) return false
      let backRefs = [].concat(resource.relationships[relationName].data).map(i => i.id)
      return (backRefs.indexOf(idToMatch) !== -1)
    })
    if (relation.meta.many) return matches
    return matches[0]
  }
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
  setTimeout(() => {
    rerouter.route({
      method,
      uri: path,
      params: _.assign({
        fields: resolvers.generateFieldsQueryFromAst(ast),
        filter: resolvers.generateFilterQueryFromAst(ast),
        include: resolvers.generateIncludeQueryFromAst(ast)
      }, args),
      originalRequest: {
        headers: req.headers || { },
        cookies: req.cookies || { }
      }
    }, (err, json) => {
      if (err) return reject(err.errors.map(e => e.detail))
      req.included = (json.included || [ ]).concat(json.data)
      resolve(json.data)
    })
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
  let asts = ast.fieldASTs
  if (asts.length === 0) return ''

  let simplifyTree = tree => {
    return tree.map(item => {
      return {
        name: item.name.value,
        arguments: item.arguments.map(arg => {
          return {
            [arg.name.value]: arg.value.value
          }
        }),
        next: simplifyTree((item.selectionSet || { }).selections || [ ])
      }
    })
  }

  let pruneTree = tree => {
    return tree.filter(item => {
      let filter = item.next.length > 0
      item.next = pruneTree(item.next)
      return filter
    })
  }

  let flattenTree = (tree, filter) => {
    if (tree.length === 0) return filter
    tree.forEach(item => {
      if (item.arguments.length === 0) return
      let itemFilters = filter[item.name] = { }
      item.arguments.forEach(arg => {
        Object.assign(itemFilters, arg)
      })
      flattenTree(item.next, itemFilters)
    })
  }

  let tree = simplifyTree(asts)
  tree = pruneTree(tree)
  // console.log(JSON.stringify(tree, null, 2))
  let params = { }
  flattenTree(tree, params)
  console.log(JSON.stringify(params, null, 2))
  return params[Object.keys(params)[0]]
}

resolvers.generateIncludeQueryFromAst = ast => {
  let asts = ast.fieldASTs
  if (asts.length === 0) return ''

  let simplifyTree = tree => {
    return tree.map(item => {
      return {
        name: item.name.value,
        next: simplifyTree((item.selectionSet || { }).selections || [ ])
      }
    })
  }

  let pruneTree = tree => {
    return tree.filter(item => {
      let filter = item.next.length > 0
      item.next = pruneTree(item.next)
      return filter
    })
  }

  let flattenTree = tree => {
    if (tree.length === 0) return []
    return [].concat.apply([], tree.map(item => {
      let next = flattenTree(item.next)
      if (next.length === 0) return [ item.name ]
      return next.map(s => `${item.name}.${s}`)
    }))
  }

  asts = (asts[0].selectionSet || { }).selections || [ ]
  let tree = simplifyTree(asts)
  tree = pruneTree(tree)
  tree = flattenTree(tree)
  return tree.join(',')
}

/* [ { kind: 'Field',
       alias: null,
       name: { kind: 'Name', value: 'articles', loc: { start: 10, end: 18 } },
       arguments: [],
       directives: [],
       selectionSet:
        { kind: 'SelectionSet',
          selections:
           [ { kind: 'Field',
               alias: null,
               name: { kind: 'Name', value: 'id', loc: { start: 25, end: 27 } },
               arguments: [],
               directives: [],
               selectionSet: null,
               loc: { start: 25, end: 27 } },
             { kind: 'Field',
               alias: null,
               name: { kind: 'Name', value: 'photos', loc: { start: 32, end: 38 } },
               arguments: [],
               directives: [],
               selectionSet:
                { kind: 'SelectionSet',
                  selections:
                   [ { kind: 'Field',
                       alias: null,
                       name: { kind: 'Name', value: 'id', loc: { start: 47, end: 49 } },
                       arguments: [],
                       directives: [],
                       selectionSet: null,
                       loc: { start: 47, end: 49 } },
                     { kind: 'Field',
                       alias: null,
                       name: { kind: 'Name', value: 'tags', loc: { start: 56, end: 60 } },
                       arguments: [],
                       directives: [],
                       selectionSet: null,
                       loc: { start: 56, end: 60 } } ],
                  loc: { start: 39, end: 66 } },
               loc: { start: 32, end: 66 } } ],
          loc: { start: 19, end: 70 } },
       loc: { start: 10, end: 70 } } ],
       */
