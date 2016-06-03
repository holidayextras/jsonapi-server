var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "circuits",
  description: "Represents a Circuit.",
  handlers: new MongoStore({
    //url: "mongodb://localhost:27017/",
    url: "mongodb://swagger:swagger1234@bigharddoors.com:27017/Apple/?ssl=true",
  }),
  searchParams: {},
  attributes: {
     circuitNum: jsonApi.Joi.string().required()
      .description("The circuit name 1 or 2.")
      .example("1"),
     cabinetNum: jsonApi.Joi.string().required()
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
    }
  ]
});
