'use strict'
const fields = module.exports = { }

const jsonApi = require('../jsonApi.js')

fields.action = (request, response, callback) => {
  const resourceList = request.params.fields
  if (!resourceList || !(resourceList instanceof Object)) return callback()

  const allDataItems = response.included.concat(response.data)

  for (const resource in resourceList) {
    if (!jsonApi._resources[resource]) {
      return callback({
        status: '403',
        code: 'EFORBIDDEN',
        title: 'Invalid field resource',
        detail: `${resource} is not a valid resource `
      })
    }

    var field = (`${resourceList[resource]}`).split(',')

    for (const j of field) {
      if (!jsonApi._resources[resource].attributes[j]) {
        return callback({
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
      if (field.indexOf(attribute) === -1) {
        delete dataItem.attributes[attribute]
      }
    })
  })

  return callback()
}
