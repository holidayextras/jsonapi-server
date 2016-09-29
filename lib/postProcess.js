'use strict'
const postProcess = module.exports = { }

const jsonApi = require('..')
const debug = require('./debugging.js')
const rerouter = require('./rerouter.js')
const async = require('async')
postProcess._applySort = require('./postProcessing/sort.js').action
postProcess._applyFilter = require('./postProcessing/filter.js').action
postProcess._applyIncludes = require('./postProcessing/include.js').action
postProcess._applyFields = require('./postProcessing/fields.js').action

postProcess.handle = (request, response, callback) => {
  async.waterfall([
    next => postProcess._applySort(request, response, next),
    next => postProcess._applyFilter(request, response, next),
    next => postProcess._applyIncludes(request, response, next),
    next => postProcess._applyFields(request, response, next)
  ], err => callback(err))
}

postProcess._fetchRelatedResources = (request, mainResource, callback) => {
  // Fetch the other objects
  let dataItems = mainResource[request.params.relation]

  if (!dataItems) return callback(null, [ null ])

  if (!(dataItems instanceof Array)) dataItems = [ dataItems ]

  let resourcesToFetch = dataItems.reduce((map, dataItem) => {
    map[dataItem.type] = map[dataItem.type] || [ ]
    map[dataItem.type].push(dataItem.id)
    return map
  }, { })

  resourcesToFetch = Object.keys(resourcesToFetch).map(type => {
    let ids = resourcesToFetch[type]
    const urlJoiner = '&filter[id]='
    ids = urlJoiner + ids.join(urlJoiner)
    let uri = `${jsonApi._apiConfig.pathPrefix + type}/?${ids}`
    if (request.route.query) {
      uri += `&${request.route.query}`
    }
    return uri
  })

  async.map(resourcesToFetch, (related, done) => {
    debug.include(related)

    rerouter.route({
      method: 'GET',
      uri: related,
      originalRequest: request,
      params: { filter: request.params.filter }
    }, (err, json) => {
      if (err) {
        debug.include('!!', JSON.stringify(err))
        return done(err.errors)
      }

      let data = json.data
      if (!(data instanceof Array)) data = [ data ]
      return done(null, data)
    })
  }, (err, otherResources) => {
    if (err) return callback(err)
    const relatedResources = [].concat.apply([], otherResources)
    return callback(null, relatedResources)
  })
}

postProcess.fetchForeignKeys = (request, items, schema, callback) => {
  if (!(items instanceof Array)) {
    items = [ items ]
  }
  items.forEach(item => {
    for (const i in schema) {
      const settings = schema[i]._settings
      if (settings && settings.__as) {
        item[i] = undefined
      }
    }
  })
  return callback()
}
