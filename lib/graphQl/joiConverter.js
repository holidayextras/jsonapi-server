const joiConverter = module.exports = { }

const graphQl = require('graphql')

joiConverter.simpleAttribute = joiScheme => {
  let type = joiScheme._type
  if (type === 'date') {
    type = 'string'
  }
  if (type === 'number') {
    type = 'float'
  }
  const uType = type[0].toUpperCase() + type.substring(1)
  type = graphQl[`GraphQL${uType}`]
  return type
}

joiConverter.swap = (joiScheme, graphQlResources) => {
  let type
  if (!joiScheme._settings) {
    type = joiConverter.simpleAttribute(joiScheme)
  } else {
    const otherType = joiScheme._settings.__one || joiScheme._settings.__many
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
    type = joiConverter.simpleAttribute(joiScheme)
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
