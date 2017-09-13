'use strict'
const fields = module.exports = { }

const jsonApi = require('../jsonApi.js')

fields.action = (request, response, callback) => {
  const resourceList = request.params.fields
  if (!resourceList || !(resourceList instanceof Object)) return callback()

  const allDataItems = response.included.concat(response.data)

  const fields = {}
  for (const resource in resourceList) {
    if (!jsonApi._resources[resource]) {
      return callback({ // eslint-disable-line standard/no-callback-literal
        status: '403',
        code: 'EFORBIDDEN',
        title: 'Invalid field resource',
        detail: `${resource} is not a valid resource `
      })
    }

    fields[resource] = (`${resourceList[resource]}`).split(',')

    for (const j of fields[resource]) {
      if (!jsonApi._resources[resource].attributes[j]) {
        return callback({ // eslint-disable-line standard/no-callback-literal
          status: '403',
          code: 'EFORBIDDEN',
          title: 'Invalid field selection',
          detail: `${resource} do not have property ${j}`
        })
      }
    }
  }

  allDataItems.forEach(dataItem => {
    Object.keys(dataItem.attributes).forEach(attribute => {
      if (fields[dataItem.type] && fields[dataItem.type].indexOf(attribute) === -1) {
        delete dataItem.attributes[attribute]
      }
    })
  })

  return callback()
}
