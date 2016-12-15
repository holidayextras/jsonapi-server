'use strict'
const schemaValidator = module.exports = { }

schemaValidator.validate = function (resources) {
  Object.keys(resources).forEach(resource => {
    Object.keys(resources[resource].attributes).forEach(attribute => {
      let joiSchema = resources[resource].attributes[attribute]
      if (!joiSchema._settings) return

      let types = joiSchema._settings.__one || joiSchema._settings.__many
      types.forEach(type => {
        if (!resources[type]) {
          throw new Error(`Error: '${resource}'.'${attribute}' is defined to hold a relation with '${type}', but '${type}' is not a valid resource name!`)
        }
      })
      let foreignRelation = joiSchema._settings.__as
      if (!foreignRelation) return

      let backReference = resources[types[0]].attributes[foreignRelation]
      if (!backReference) {
        throw new Error(`Error: '${resource}'.'${attribute}' is defined as being a foreign relation to the primary '${types[0]}'.'${foreignRelation}', but that primary relationship does not exist!`)
      }
    })
  })
}
