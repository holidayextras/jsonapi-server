'use strict'
const joiConverter = module.exports = { }

const graphQl = require('graphql')
const readTypes = require('./readTypes.js')

joiConverter.simpleAttribute = (joiScheme, write) => {
  let type = joiScheme._type
  if (type === 'any') {
    // { _valids: { _set: [ 'M', 'F' ] } }
    type = typeof (joiScheme._valids._set || [ ])[0]
  }
  if (type === 'date') {
    type = 'string'
  }
  if (type === 'number') {
    type = 'float'
  }

  if (type === 'array') {
    if (joiScheme._inner.items.length !== 1) {
      throw new Error('Joi arrays must contain a single type')
    }
    const innerType = joiConverter.simpleAttribute(joiScheme._inner.items[0], write)
    type = new graphQl.GraphQLList(innerType)
  } else if (type === 'object') {
    let fields = { }
    joiScheme._inner.children.forEach(attr => {
      fields[attr.key] = {
        // args: filterArgs.generate(resource),
        // resolve: resolvers.search.bind(resolvers, resourceConfig, null),
        type: joiConverter.simpleAttribute(attr.schema)
      }
    })
    let ObjType = graphQl.GraphQLObjectType
    if (write) {
      ObjType = graphQl.GraphQLInputObjectType
    }
    type = new ObjType({
      name: ('a' + Math.random()).replace('.', ''),
      description: joiScheme._description,
      fields
    })
  } else {
    const uType = type[0].toUpperCase() + type.substring(1)
    type = graphQl[`GraphQL${uType}`]
  }
  return type
}

joiConverter.swap = (joiScheme, graphQlResources) => {
  let type
  if (!joiScheme._settings) {
    type = joiConverter.simpleAttribute(joiScheme)
  } else {
    let otherType = joiScheme._settings.__one || joiScheme._settings.__many
    otherType = otherType.join(readTypes.UNION_JOIN_CONST)
    type = graphQlResources[otherType]

    if (joiScheme._settings.__many) {
      type = new graphQl.GraphQLList(type)
    }
  }

  if ((joiScheme._flags || { }).presence === 'required') {
    type = new graphQl.GraphQLNonNull(type)
  }
  return type
}

joiConverter.shallowInput = joiScheme => {
  let type
  if (!joiScheme._settings) {
    type = joiConverter.simpleAttribute(joiScheme, true)
  } else {
    type = oneRelationship
    if (joiScheme._settings.__many) {
      type = manyRelationship
    }
  }

  if ((joiScheme._flags || { }).presence === 'required') {
    type = new graphQl.GraphQLNonNull(type)
  }
  return type
}

var oneRelationship = new graphQl.GraphQLInputObjectType({
  name: 'oneRelationship',
  fields: {
    id: {
      type: new graphQl.GraphQLNonNull(graphQl.GraphQLString),
      description: 'The UUID of another resource'
    }
  }
})
var manyRelationship = new graphQl.GraphQLList(oneRelationship)
