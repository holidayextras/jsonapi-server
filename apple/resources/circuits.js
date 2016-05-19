var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "circuits",
  description: "Represents a Circuit.",
  handlers: new MongoStore({
    //url: "mongodb://localhost:27017/",
    url: "mongodb://swagger:swagger1234@bigharddoors.com:27017/?ssl=true",
  }),
  searchParams: {},
  attributes: {
     circuit: jsonApi.Joi.string().required()
      .description("The circuit name CR1 or CR2.")
      .example("CR1"),
     rack: jsonApi.Joi.string().required()
      .description("The rack number 1-5.")
      .example("1"),
     cabinet: jsonApi.Joi.string().required()
      .description("The cabinet number 1-35.")
      .example("1"),
     tags: jsonApi.Joi.many("tags")
      .description("All of the tags associated with this circuit."),
     rack: jsonApi.Joi.belongsToOne({
      resource: "racks",
      as: "circuits"
    })
  },
  examples: [
    {
            id: "1234a4de-4986-4597-81b9-cf31b4859486",
            type: "circuits",
            name: "CIRCUIT1",
            tags: [
              { type: "tags", id: "6847a4de-1234-4597-81b9-cf31b4859486" }
            ]
        }
  ]
});
