var jsonApi = require("../../.");

jsonApi.define({
  namespace: "json:api",
  resource: "comments",
  description: "Allow people to attach short messages to articles",
//  handlers: jsonApi.mockHandlers,
  searchParams: { },
  attributes: {
    body: jsonApi.Joi.string()
      .description("The tag name")
      .example("Summer"),
    timestamp: jsonApi.Joi.date().format("YYYY-MM-DD")
      .description("The date on which the comment was created, YYYY-MM-DD")
      .example("2017-05-01"),
    author: jsonApi.Joi.one("people")
      .description("The person who wrote the comment"),
    article: jsonApi.Joi.belongsToOne({
      resource: "articles",
      as: "comments"
    })
  },
  examples: [
    {
      id: "6b017640-827c-4d50-8dcc-79d766abb408",
      type: "comments",
      body: "First!",
      timestamp: "2017-01-02",
      author: { type: "people", id: "ad3aa89e-9c5b-4ac9-a652-6670f9f27587" }
    },
    {
      id: "3f1a89c2-eb85-4799-a048-6735db24b7eb",
      type: "comments",
      body: "I like XML better",
      timestamp: "2017-06-20",
      author: { type: "people", id: "32fb0105-acaa-4adb-9ec4-8b49633695e1", meta: { created: "2010-01-01" } }
    }
  ]
});
