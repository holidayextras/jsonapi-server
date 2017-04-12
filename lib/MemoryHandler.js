'use strict'
const _ = {
  assign: require('lodash.assign')
}

const MemoryStore = module.exports = function MemoryStore () {
}

// resources represents out in-memory data store
const resources = { }

/**
  Handlers readiness status. This should be set to `true` once all handlers are ready to process requests.
 */
MemoryStore.prototype.ready = false

/**
  initialise gets invoked once for each resource that uses this hander.
  In this instance, we're allocating an array in our in-memory data store.
 */
MemoryStore.prototype.initialise = function (resourceConfig) {
  resources[resourceConfig.resource] = resourceConfig.examples || [ ]
  this.ready = true
}

/**
  Search for a list of resources, given a resource type.
 */
MemoryStore.prototype.search = function (request, callback) {
  const self = this

  let results = [].concat(resources[request.params.type])
  self._sortList(request, results)
  const resultCount = results.length
  if (request.params.page) {
    results = results.slice(request.params.page.offset, request.params.page.offset + request.params.page.limit)
  }
  return callback(null, MemoryStore._clone(results), resultCount)
}

/**
  Find a specific resource, given a resource type and and id.
 */
MemoryStore.prototype.find = (request, callback) => {
  // Pull the requested resource from the in-memory store
  const theResource = resources[request.params.type].filter(anyResource => anyResource.id === request.params.id).pop()

  // If the resource doesn't exist, error
  if (!theResource) {
    return callback({
      status: '404',
      code: 'ENOTFOUND',
      title: 'Requested resource does not exist',
      detail: `There is no ${request.params.type} with id ${request.params.id}`
    })
  }

  // Return the requested resource
  return callback(null, MemoryStore._clone(theResource))
}

/**
  Create (store) a new resource given a resource type and an object.
 */
MemoryStore.prototype.create = (request, newResource, callback) => {
  // Check to see if the ID already exists
  const index = MemoryStore._indexOf(resources[request.params.type], newResource)
  if (index !== -1) {
    return callback({
      status: '403',
      code: 'EFORBIDDEN',
      title: 'Requested resource already exists',
      detail: `The requested resource already exists of type ${request.params.type} with id ${request.params.id}`
    })
  }
  // Push the newResource into our in-memory store.
  resources[request.params.type].push(newResource)
  // Return the newly created resource
  return callback(null, MemoryStore._clone(newResource))
}

/**
  Delete a resource, given a resource type and and id.
 */
MemoryStore.prototype.delete = function (request, callback) {
  // Find the requested resource
  this.find(request, (err, theResource) => {
    if (err) return callback(err)

    // Remove the resource from the in-memory store.
    const index = MemoryStore._indexOf(resources[request.params.type], theResource)
    resources[request.params.type].splice(index, 1)

    // Return with no error
    return callback()
  })
}

/**
  Update a resource, given a resource type and id, along with a partialResource.
  partialResource contains a subset of changes that need to be merged over the original.
 */
MemoryStore.prototype.update = function (request, partialResource, callback) {
  // Find the requested resource
  this.find(request, (err, theResource) => {
    if (err) return callback(err)

    // Merge the partialResource over the original
    theResource = _.assign(theResource, partialResource)

    // Push the newly updated resource back into the in-memory store
    const index = MemoryStore._indexOf(resources[request.params.type], theResource)
    resources[request.params.type][index] = theResource

    // Return the newly updated resource
    return callback(null, MemoryStore._clone(theResource))
  })
}

/**
  Internal helper function to sort data
 */
MemoryStore.prototype._sortList = (request, list) => {
  let attribute = request.params.sort
  if (!attribute) return

  let ascending = 1
  attribute = (`${attribute}`)
  if (attribute[0] === '-') {
    ascending = -1
    attribute = attribute.substring(1, attribute.length)
  }

  list.sort((a, b) => {
    if (typeof a[attribute] === 'string') {
      return a[attribute].localeCompare(b[attribute]) * ascending
    } else if (typeof a[attribute] === 'number') {
      return (a[attribute] - b[attribute]) * ascending
    } else {
      return 0
    }
  })
}

MemoryStore._clone = obj => JSON.parse(JSON.stringify(obj))

MemoryStore._indexOf = (list, obj) => {
  for (const i in list) {
    if (list[i].id === obj.id) return i
  }
  return -1
}
