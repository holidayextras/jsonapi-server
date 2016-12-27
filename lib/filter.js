'use strict'
const filter = module.exports = { }

const FILTER_OPERATORS = ['<', '>', '~', ':']
const STRING_ONLY_OPERATORS = ['~', ':']
const FILTER_SEPERATOR = ','

filter._resourceDoesNotHaveProperty = (resourceConfig, key) => {
  if (resourceConfig.attributes[key]) return null
  return {
    status: '403',
    code: 'EFORBIDDEN',
    title: 'Invalid filter',
    detail: `${resourceConfig.resource} do not have attribute or relationship '${key}'`
  }
}

filter._relationshipIsForeign = (resourceConfig, key) => {
  const relationSettings = resourceConfig.attributes[key]._settings
  if (!relationSettings || !relationSettings.__as) return null
  return {
    status: '403',
    code: 'EFORBIDDEN',
    title: 'Invalid filter',
    detail: `Filter relationship '${key}' is a foreign reference and does not exist on ${resourceConfig.resource}`
  }
}

filter._splitElement = element => {
  if (!element) return null
  if (FILTER_OPERATORS.indexOf(element[0]) !== -1) {
    return { operator: element[0], value: element.substring(1) }
  }
  return { operator: null, value: element }
}

filter._stringOnlyOperator = (operator, attributeConfig) => {
  if (!operator || !attributeConfig) return null
  if (STRING_ONLY_OPERATORS.indexOf(operator) !== -1 && attributeConfig._type !== 'string') {
    return `operator ${operator} can only be applied to string attributes`
  }
  return null
}

filter._parseScalarFilterElement = (attributeConfig, scalarElement) => {
  if (!scalarElement) return { error: 'invalid or empty filter element' }

  const splitElement = filter._splitElement(scalarElement)
  if (!splitElement) return { error: 'empty filter' }

  const error = filter._stringOnlyOperator(splitElement.operator, attributeConfig)
  if (error) return { error }

  if (attributeConfig._settings) {  // relationship attribute: no further validation
    return { result: splitElement }
  }

  const validateResult = attributeConfig.validate(splitElement.value)
  if (validateResult.error) {
    return { error: validateResult.error.message }
  }

  const validatedElement = { operator: splitElement.operator, value: validateResult.value }
  return { result: validatedElement }
}

filter._parseFilterElementHelper = (attributeConfig, filterElement) => {
  if (!filterElement) return { error: 'invalid or empty filter element' }

  const parsedElements = [].concat(filterElement).map(scalarElement => filter._parseScalarFilterElement(attributeConfig, scalarElement))

  if (parsedElements.length === 1) return parsedElements[0]

  const errors = parsedElements.reduce((combined, element) => {
    if (!combined) {
      if (!element.error) return combined
      return [ element.error ]
    }
    return combined.concat(element.error)
  }, null)

  if (errors) return { error: errors }

  const results = parsedElements.map(element => element.result)

  return { result: results }
}

filter._parseFilterElement = (attributeName, attributeConfig, filterElement) => {
  const helperResult = filter._parseFilterElementHelper(attributeConfig, filterElement)

  if (helperResult.error) {
    return {
      error: {
        status: '403',
        code: 'EFORBIDDEN',
        title: 'Invalid filter',
        detail: `Filter value for key '${attributeName}' is invalid: ${helperResult.error}`
      }
    }
  }
  return { result: helperResult.result }
}

filter.parseAndValidate = request => {
  if (!request.params.filter) return null

  const resourceConfig = request.resourceConfig

  const processedFilter = { }
  let error
  let filterElement
  let parsedFilterElement

  for (const key in request.params.filter) {
    filterElement = request.params.filter[key]

    if (typeof filterElement === 'string') request.params.filter[key] = filterElement = filterElement.split(FILTER_SEPERATOR)

    if (!Array.isArray(filterElement) && filterElement instanceof Object) continue  // skip deep filters

    error = filter._resourceDoesNotHaveProperty(resourceConfig, key)
    if (error) return error

    error = filter._relationshipIsForeign(resourceConfig, key)
    if (error) return error

    parsedFilterElement = filter._parseFilterElement(key, resourceConfig.attributes[key], filterElement)
    if (parsedFilterElement.error) return parsedFilterElement.error

    processedFilter[key] = [].concat(parsedFilterElement.result)
  }

  request.processedFilter = processedFilter

  return null
}
