var jsonApi = require("../../.");

jsonApi.define({
  namespace: "json:api",
  resource: "tags",
  description: "Used to group resources together, useful for finding related resources.",
  handlers: new jsonApi.MockHandler(),
  searchParams: { },
  attributes: {
    name: jsonApi.Joi.string()
      .description("The tag name")
      .example("Summer"),
    articles: jsonApi.Joi.belongsToMany({
      resource: "articles",
      as: "tags"
    })
  },
  examples: [
    {
      id: "7541a4de-4986-4597-81b9-cf31b6762486",
      type: "tags",
      name: "live"
    },
    {
      id: "2a3bdea4-a889-480d-b886-104498c86f69",
      type: "tags",
      name: "staging"
    },
    {
      id: "6ec62f6d-9f82-40c5-b4f4-279ed1765492",
      type: "tags",
      name: "needs-work"
    }
  ]
});
