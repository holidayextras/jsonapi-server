const swaggerValidator = module.exports = { }

const swagger = require('../lib/swagger')
const url = require('url')
let swaggerDoc

swaggerValidator.assert = (params, statusCode, json) => {
  if (!swaggerDoc) swaggerDoc = swagger.generateDocumentation()
  const urlObj = url.parse(params.url, true)
  swaggerValidator._validateRequest(params.method.toLowerCase(), urlObj.pathname, JSON.parse(params.body || 'null'))
  swaggerValidator._validatePayload(params.method.toLowerCase(), urlObj.pathname, statusCode, JSON.parse(json))
}

swaggerValidator._validateRequest = (method, path, body) => {
  const model = swaggerValidator._getModel(method, path)

  // Default Error model only implies a 404
  if (Object.keys(model.responses).length === 1) return null

  const bodySchema = model.parameters.filter(parameter => parameter.in === 'body').pop()

  // If there is no schema and no body, all is good
  if (!bodySchema && !body) return null

  return swaggerValidator._validateModel(bodySchema.schema, body, `${method}@${path}`, 'request', true)
}

swaggerValidator._validatePayload = (method, path, httpCode, payload) => {
  const model = swaggerValidator._getModel(method, path)
  let schema = model.responses[httpCode]

  if (!schema) {
    schema = model.responses.default
  }
  if (!schema) throw new Error(`Unknown payload for ${method}, ${path}, ${httpCode}`)

  return swaggerValidator._validateModel(schema.schema, payload, `${method}@${path}`, 'response', true)
}

swaggerValidator._getModel = (method, path) => {
  path = path.replace('/rest/', '/').replace(/\/$/, '')
  let match = Object.keys(swaggerDoc.paths).filter(somePath => {
    somePath = somePath.replace(/\{[a-zA-Z-_]*\}/gi, '(.*?)')
    somePath = `^${somePath}$`
    somePath = new RegExp(somePath)
    return somePath.test(path)
  }).pop()

  if (!match) {
    if (path.indexOf('foobar') !== -1) {
      return { responses: { default: { schema: { $ref: '#/definitions/error' } } } }
    }
    throw new Error(`Swagger Validation: No matching path for ${path}`)
  }

  match = swaggerDoc.paths[match]
  match = match[method]

  if (!match) {
    throw new Error(`Swagger Validation: No matching path for ${method} ${path}`)
  }
  return match
}

swaggerValidator._validateModel = (model, payload, urlPath, validationPath, required) => {
  if (!model) return
  if (required && !payload) {
    throw new Error(`Swagger Validation: ${urlPath} Expected required value at ${validationPath}`)
  }
  if (!payload) return

  if (model.$ref) {
    model = swaggerValidator._getRef(model.$ref)
  }

  if (model.type === 'array') {
    swaggerValidator._validateArray(model, payload, urlPath, validationPath)
  } else if (model.type === 'object') {
    swaggerValidator._validateObject(model, payload, urlPath, validationPath)
  } else {
    swaggerValidator._validateOther(model, payload, urlPath, validationPath)
  }
}

swaggerValidator._validateArray = (model, payload, urlPath, validationPath) => {
  if (!(payload instanceof Array)) {
    throw new Error(`Swagger Validation: ${urlPath} Expected Array at ${validationPath}`)
  }
  payload.forEach((i, j) => {
    swaggerValidator._validateModel(model.items, i, urlPath, `${validationPath}[${j}]`, model.required)
  })
}

swaggerValidator._validateObject = (model, payload, urlPath, validationPath) => {
  if (!model.properties) return

  for (const i in model.properties) {
    const isRequired = ((model.required || [ ]).indexOf(i) !== -1)
    swaggerValidator._validateModel(model.properties[i], payload[i], urlPath, `${validationPath}.${i}`, isRequired)
  }

  for (const j in payload) {
    if (!model.properties[j]) {
      throw new Error(`Swagger Validation: ${urlPath} Found unexpected property at ${validationPath}.${j}`)
    }
  }
}

swaggerValidator._validateOther = (model, payload, urlPath, validationPath) => {
  if (model.type === 'string') {
    if (typeof payload !== 'string') {
      throw new Error(`Swagger Validation: ${urlPath} Expected string at ${validationPath}, got ${typeof payload}`)
    }
  } else if (model.type === 'number') {
    if (typeof payload !== 'number') {
      throw new Error(`Swagger Validation: ${urlPath} Expected number at ${validationPath}, got ${typeof payload}`)
    }
  } else if (model.type === 'boolean') {
    if (typeof payload !== 'boolean') {
      throw new Error(`Swagger Validation: ${urlPath} Expected boolean at ${validationPath}, got ${typeof payload}`)
    }
  } else {
    throw new Error(`Swagger Validation: ${urlPath} Unknown type ${model.type} at ${validationPath}`)
  }
}

swaggerValidator._getRef = ref => {
  ref = ref.split('/')
  ref.shift()
  let model = swaggerDoc
  while (ref.length) {
    model = model[ref.shift()]
  }
  return model
}
