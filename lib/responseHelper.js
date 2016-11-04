'use strict'
const responseHelper = module.exports = { }

const _ = {
  assign: require('lodash.assign'),
  pick: require('lodash.pick')
}
const async = require('async')
const pagination = require('./pagination.js')
const Joi = require('joi')
const debug = require('./debugging.js')

responseHelper.setBaseUrl = baseUrl => {
  responseHelper._baseUrl = baseUrl
}
responseHelper.setMetadata = meta => {
  responseHelper._metadata = meta
}

responseHelper._enforceSchemaOnArray = (items, schema, callback) => {
  if (!(items instanceof Array)) {
    items = [ items ]
  }
  async.map(items, (item, done) => responseHelper._enforceSchemaOnObject(item, schema, done), (err, results) => {
    if (err) return callback(err)

    results = results.filter(result => !!result)
    return callback(null, results)
  })
}

responseHelper._enforceSchemaOnObject = (item, schema, callback) => {
  debug.validationOutput(JSON.stringify(item))
  Joi.validate(item, schema, (err, sanitisedItem) => {
    if (err) {
      debug.validationError(err.message, JSON.stringify(item))
      return callback(null, null)
    }

    const dataItem = responseHelper._generateDataItem(sanitisedItem, schema)
    return callback(null, dataItem)
  })
}

responseHelper._generateDataItem = (item, schema) => {
  const isSpecialProperty = value => {
    if (!(value instanceof Object)) return false
    if (value._settings) return true
    return false
  }
  const linkProperties = Object.keys(schema).filter(someProperty => isSpecialProperty(schema[someProperty]))
  const attributeProperties = Object.keys(schema).filter(someProperty => {
    if (someProperty === 'id') return false
    if (someProperty === 'type') return false
    if (someProperty === 'meta') return false
    return !isSpecialProperty(schema[someProperty])
  })

  const result = {
    type: item.type,
    id: item.id,
    attributes: _.pick(item, attributeProperties),
    links: responseHelper._generateLinks(item, schema, linkProperties),
    relationships: responseHelper._generateRelationships(item, schema, linkProperties),
    meta: item.meta
  }

  return result
}

responseHelper._generateLinks = item => ({
  self: `${responseHelper._baseUrl + item.type}/${item.id}`
})

responseHelper._generateRelationships = (item, schema, linkProperties) => {
  if (linkProperties.length === 0) return undefined

  const links = { }

  linkProperties.forEach(linkProperty => {
    links[linkProperty] = responseHelper._generateLink(item, schema[linkProperty], linkProperty)
  })

  return links
}

responseHelper._generateLink = (item, schemaProperty, linkProperty) => {
  const link = {
    meta: {
      relation: 'primary',
      // type: schemaProperty._settings.__many || schemaProperty._settings.__one,
      readOnly: false
    },
    links: {
      self: `${responseHelper._baseUrl + item.type}/${item.id}/relationships/${linkProperty}`,
      related: `${responseHelper._baseUrl + item.type}/${item.id}/${linkProperty}`
    },
    data: null
  }

  if (schemaProperty._settings.__many) {
    // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
    link.data = [ ]
    let linkItems = item[linkProperty]
    if (linkItems) {
      if (!(linkItems instanceof Array)) linkItems = [ linkItems ]
      linkItems.forEach(linkItem => {
        link.data.push({
          type: linkItem.type,
          id: linkItem.id,
          meta: linkItem.meta
        })
      })
    }
  }

  if (schemaProperty._settings.__one) {
    const linkItem = item[linkProperty]
    if (linkItem) {
      // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
      link.data = {
        type: linkItem.type,
        id: linkItem.id,
        meta: linkItem.meta
      }
    }
  }

  if (schemaProperty._settings.__as) {
    const relatedResource = (schemaProperty._settings.__one || schemaProperty._settings.__many)[0]
    // get information about the linkage - list of ids and types
    // /rest/bookings/relationships/?customer=26aa8a92-2845-4e40-999f-1fa006ec8c63
    link.links.self = `${responseHelper._baseUrl + relatedResource}/relationships/?${schemaProperty._settings.__as}=${item.id}`
    // get full details of all linked resources
    // /rest/bookings/?filter[customer]=26aa8a92-2845-4e40-999f-1fa006ec8c63
    link.links.related = `${responseHelper._baseUrl + relatedResource}/?filter[${schemaProperty._settings.__as}]=${item.id}`
    if (!item[linkProperty]) {
      // $FlowFixMe: the data property can be either undefined (not present), null or [ ]
      link.data = undefined
    }
    link.meta = {
      relation: 'foreign',
      belongsTo: relatedResource,
      as: schemaProperty._settings.__as,
      many: !!schemaProperty._settings.__many,
      readOnly: true
    }
  }

  return link
}

responseHelper.generateError = (request, err) => {
  debug.errors(request.route.verb, request.route.combined, JSON.stringify(err))
  if (!(err instanceof Array)) err = [ err ]

  const errorResponse = {
    jsonapi: {
      version: '1.0'
    },
    meta: responseHelper._generateMeta(request),
    links: {
      self: responseHelper._baseUrl + request.route.path
    },
    errors: err.map(error => ({
      status: error.status,
      code: error.code,
      title: error.title,
      detail: error.detail
    }))
  }

  return errorResponse
}

responseHelper._generateResponse = (request, resourceConfig, sanitisedData, handlerTotal) => ({
  jsonapi: {
    version: '1.0'
  },

  meta: responseHelper._generateMeta(request, handlerTotal),

  links: _.assign({
    self: responseHelper._baseUrl + request.route.path + (request.route.query ? ('?' + request.route.query) : '')
  }, pagination.generatePageLinks(request, handlerTotal)),

  data: sanitisedData
})

responseHelper._generateMeta = (request, handlerTotal) => {
  let meta
  if (typeof responseHelper._metadata === 'function') {
    meta = responseHelper._metadata(request)
  } else {
    meta = _.assign({ }, responseHelper._metadata)
  }

  if (handlerTotal) {
    meta.page = pagination.generateMetaSummary(request, handlerTotal)
  }

  return meta
}
