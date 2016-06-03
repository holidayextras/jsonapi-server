var jsonApi = require("../../.");
var peopleHandler = require("../handlers/peopleHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "people",
  description: "Used to attribute work to specific people.",
  handlers: peopleHandler,
  searchParams: { },
  attributes: {
    firstname: jsonApi.Joi.string().alphanum()
      .description("The persons first name")
      .example("John"),
    lastname: jsonApi.Joi.string().alphanum()
      .description("The persons last name")
      .example("Smith"),
    email: jsonApi.Joi.string().email()
      .description("The persons preferred contact email address")
      .example("john.smith@gmail.com"),
    articles: jsonApi.Joi.belongsToMany({
      resource: "articles",
      as: "author"
    }),
    photos: jsonApi.Joi.belongsToMany({
      resource: "photos",
      as: "photographer"
    })
  },
  examples: [
    {
      id: "cc5cca2e-0dd8-4b95-8cfc-a11230e73116",
      type: "people",
      firstname: "Oli",
      lastname: "Rumbelow",
      email: "oliver.rumbelow@example.com"
    },
    {
      id: "32fb0105-acaa-4adb-9ec4-8b49633695e1",
      type: "people",
      firstname: "Pedro",
      lastname: "Romano",
      email: "pedro.romano@example.com"
    },
    {
      id: "d850ea75-4427-4f81-8595-039990aeede5",
      type: "people",
      firstname: "Mark",
      lastname: "Fermor",
      email: "mark.fermor@example.com"
    },
    {
      id: "ad3aa89e-9c5b-4ac9-a652-6670f9f27587",
      type: "people",
      firstname: "Rahul",
      lastname: "Patel",
      email: "rahul.patel@example.com"
    }
  ]
});
