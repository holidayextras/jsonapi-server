var jsonApi = require("../../.");
var commentHandler = require("../handlers/commentHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "comments",
  description: "Allow people to attach short messages to articles",
  handlers: commentHandler,
  searchParams: { },
  attributes: {
    body: jsonApi.Joi.string().required()
      .description("The tag name")
      .example("Summer"),
    timestamp: jsonApi.Joi.string().regex(/^[12]\d\d\d-[01]\d-[0123]\d$/)
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
    },
    {
      id: "2f716574-cef6-4238-8285-520911af86c1",
      type: "comments",
      body: "Wibble wibble.",
      timestamp: "2017-12-31",
      author: null
    }
  ]
});
