var jsonApi = require("../../.");
var tagHandler = require("../handlers/tagHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "tags",
  description: "Used to group resources together, useful for finding related resources.",
  handlers: tagHandler,
  searchParams: { },
  attributes: {
    name: jsonApi.Joi.string()
      .description("The tag name")
      .example("Summer"),
    articles: jsonApi.Joi.belongsToMany({
      resource: "articles",
      as: "tags"
    }),
    parent: jsonApi.Joi.one("tags"),
    children: jsonApi.Joi.belongsToMany({
      resource: "tags",
      as: "parent"
    })
  },
  examples: [
    {
      id: "7541a4de-4986-4597-81b9-cf31b6762486",
      type: "tags",
      name: "live",
      parent: { type: "tags", id: "2a3bdea4-a889-480d-b886-104498c86f69" }
    },
    {
      id: "2a3bdea4-a889-480d-b886-104498c86f69",
      type: "tags",
      name: "staging",
      parent: { type: "tags", id: "6ec62f6d-9f82-40c5-b4f4-279ed1765492" }
    },
    {
      id: "6ec62f6d-9f82-40c5-b4f4-279ed1765492",
      type: "tags",
      name: "building",
      parent: { type: "tags", id: "68538177-7a62-4752-bc4e-8f971d253b42" }
    },
    {
      id: "68538177-7a62-4752-bc4e-8f971d253b42",
      type: "tags",
      name: "development",
      parent: { type: "tags", id: "8d196606-134c-4504-a93a-0d372f78d6c5" }
    },
    {
      id: "8d196606-134c-4504-a93a-0d372f78d6c5",
      type: "tags",
      name: "planning",
      parent: null
    }
  ]
});
