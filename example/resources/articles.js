var jsonApi = require("../../.");
var articleHandler = require("../handlers/articleHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "articles",
  description: "Represents the core content, people love to read articles.",
  handlers: articleHandler,
  searchParams: {
    query: jsonApi.Joi.number()
      .description("Fuzzy text match against titles")
      .example(123)
  },
  attributes: {
    title: jsonApi.Joi.string().required()
      .description("The articles title, should be between 8 and 15 words")
      .example("Learning how to use JSON:API"),
    content: jsonApi.Joi.string().required()
      .description("The main body of the article, provided as HTML")
      .example("<p>Paragraph 1. Lovely.</p><hr /><p>The End.</p>"),
    created: jsonApi.Joi.string().regex(/^[12]\d\d\d-[01]\d-[0123]\d$/)
      .description("The date on which the article was created, YYYY-MM-DD")
      .example("2017-05-01"),
    status: jsonApi.Joi.string().default("published")
      .description("The status of the article - draft, ready, published")
      .example("published"),
    views: jsonApi.Joi.number().default(0)
      .description("Number of views for this article"),
    author: jsonApi.Joi.one("people")
      .description("The person who wrote the article"),
    tags: jsonApi.Joi.many("tags")
      .description("All of the tags associated with an article"),
    photos: jsonApi.Joi.many("photos")
      .description("List of all the photos included in an article"),
    comments: jsonApi.Joi.many("comments")
      .description("All of the comments posted on this article")
  },
  examples: [
    {
      id: "de305d54-75b4-431b-adb2-eb6b9e546014",
      type: "articles",
      title: "NodeJS Best Practices",
      content: "na",
      created: "2016-01-05",
      views: 10,
      author: {
        type: "people",
        id: "cc5cca2e-0dd8-4b95-8cfc-a11230e73116",
        meta: { updated: "2010-11-06" }
      },
      tags: [
        { type: "tags", id: "7541a4de-4986-4597-81b9-cf31b6762486" }
      ],
      photos: [ ],
      comments: [
        { type: "comments", id: "3f1a89c2-eb85-4799-a048-6735db24b7eb" }
      ],
      meta: {
        updated: "2011-05-10"
      }
    },
    {
      id: "1be0913c-3c25-4261-98f1-e41174025ed5",
      type: "articles",
      title: "Linux Rocks",
      content: "na",
      created: "2015-11-11",
      views: 20,
      author: { type: "people", id: "d850ea75-4427-4f81-8595-039990aeede5" },
      tags: [
        { type: "tags", id: "2a3bdea4-a889-480d-b886-104498c86f69" }
      ],
      photos: [
        { type: "photos", id: "aab14844-97e7-401c-98c8-0bd5ec922d93" },
        { type: "photos", id: "72695cbd-e9ef-44f6-85e0-0dbc06a269e8" }
      ],
      comments: [ ]
    },
    {
      id: "d850ea75-4427-4f81-8595-039990aeede5",
      type: "articles",
      title: "How to AWS",
      content: "na",
      created: "2016-02-08",
      views: 30,
      author: { type: "people", id: "32fb0105-acaa-4adb-9ec4-8b49633695e1" },
      tags: [
        { type: "tags", id: "8d196606-134c-4504-a93a-0d372f78d6c5" }
      ],
      photos: [
        { type: "photos", id: "aab14844-97e7-401c-98c8-0bd5ec922d93" }
      ],
      comments: [ ]
    },
    {
      id: "fa2a073f-8c64-4cbb-9158-b8f67a4ab9f5",
      type: "articles",
      title: "Tea for Beginners",
      content: "na",
      created: "2015-06-23",
      views: 40,
      author: { type: "people", id: "ad3aa89e-9c5b-4ac9-a652-6670f9f27587" },
      tags: [
        { type: "tags", id: "6ec62f6d-9f82-40c5-b4f4-279ed1765492" },
        { type: "tags", id: "7541a4de-4986-4597-81b9-cf31b6762486" }
      ],
      photos: [
        { type: "photos", id: "4a8acd65-78bb-4020-b9eb-2d058a86a2a0" }
      ],
      comments: [
        { type: "comments", id: "6b017640-827c-4d50-8dcc-79d766abb408" }
      ]
    }
  ]
});
