var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "racks",
  description: "Represents a Rack.",
  handlers: new MongoStore({
    //url: "mongodb://localhost:27017/",
    url: process.env.MONGO_URL
    // url: "mongodb://swagger:swagger1234@localhost:27017/Apple",
  }),
  searchParams: {},
  attributes: {
     rackNum: jsonApi.Joi.string().required()
      .description("The rack number 1-5.")
      .example("1"),
     cabinetNum: jsonApi.Joi.string().required().allow('')
      .description("The cabinet number 1-35.")
      .example("1"),
     circuits: jsonApi.Joi.many("circuits").optional()
      .description("All of the circuits associated with this rack. RACK0 will have no circuits."),
     dps: jsonApi.Joi.belongsToOne({
      resource: "dps",
      as: "racks"
    })
  },
  examples: [{}]
});
