'use strict'
const filter = module.exports = { }

const _ = {
  assign: require('lodash.assign'),
  isEqual: require('lodash.isequal')
}
const debug = require('../debugging.js')

filter.action = (request, response, callback) => {
  const filters = request.processedFilter
  if (!filters) return callback()

  if (response.data instanceof Array) {
    for (let j = 0; j < response.data.length; j++) {
      if (!filter._filterKeepObject(response.data[j], filters)) {
        debug.filter('removed', JSON.stringify(filters), JSON.stringify(response.data[j].attributes))
        response.data.splice(j, 1)
        j--
      }
    }
  } else if (response.data instanceof Object) {
    if (!filter._filterKeepObject(response.data, filters)) {
      debug.filter('removed', JSON.stringify(filters), JSON.stringify(response.data.attributes))
      response.data = null
    }
  }

  return callback()
}

filter._filterMatches = (filterElement, attributeValue) => {
  if (!filterElement.operator) {
    return _.isEqual(attributeValue, filterElement.value)
  }
  const filterFunction = {
    '>': function filterGreaterThan (attrValue, filterValue) {
      return attrValue > filterValue
    },
    '<': function filterLessThan (attrValue, filterValue) {
      return attrValue < filterValue
    },
    '~': function filterCaseInsensitiveEqual (attrValue, filterValue) {
      return attrValue.toLowerCase() === filterValue.toLowerCase()
    },
    ':': function filterCaseInsensitiveContains (attrValue, filterValue) {
      return attrValue.toLowerCase().indexOf(filterValue.toLowerCase()) !== -1
    }
  }[filterElement.operator]
  const result = filterFunction(attributeValue, filterElement.value)
  return result
}

filter._filterKeepObject = (someObject, filters) => {
  for (const filterName in filters) {
    const whitelist = filters[filterName]

    if (someObject.attributes.hasOwnProperty(filterName) || (filterName === 'id')) {
      let attributeValue = someObject.attributes[filterName]
      if (filterName === 'id') attributeValue = someObject.id
      const attributeMatches = filter._attributesMatchesOR(attributeValue, whitelist)
      if (!attributeMatches) return false
    } else if (someObject.relationships.hasOwnProperty(filterName)) {
      const relationships = someObject.relationships[filterName]
      const relationshipMatches = filter._relationshipMatchesOR(relationships, whitelist)
      if (!relationshipMatches) return false
    } else {
      return false
    }
  }
  return true
}

filter._attributesMatchesOR = (attributeValue, whitelist) => {
  let matchOR = false
  whitelist.forEach(filterElement => {
    if (filter._filterMatches(filterElement, attributeValue)) {
      matchOR = true
    }
  })
  return matchOR
}

filter._relationshipMatchesOR = (relationships, whitelist) => {
  let matchOR = false

  let data = relationships.data
  if (!data) return false

  if (!(data instanceof Array)) data = [ data ]
  data = data.map(relation => relation.id)

  whitelist.forEach(filterElement => {
    if (data.indexOf(filterElement.value) !== -1) {
      matchOR = true
    }
  })
  return matchOR
}
