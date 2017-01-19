var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "dps",
  description: "Represents a Distribution Power Panel.",
  handlers: new MongoStore({
    //url: "mongodb://localhost:27017/",
    url: process.env.MONGO_URL
    // url: "mongodb://swagger:swagger1234@localhost:27017/Apple",
  }),
  searchParams: {},
  attributes: {
    name: jsonApi.Joi.string().required()
      .description("The panel name.")
      .example("DP01A"),
    cabinetNum: jsonApi.Joi.string().required()
      .description("The cabinet number (1-35).")
      .example("1"),
    rackNum: jsonApi.Joi.string().required()
      .description("The rack number (0-5).")
      .example("1"),
    ipAddressPlc: jsonApi.Joi.string().required()
      .description("The IP address of the plc.")
      .example("10.10.10.12"),
    macAddressPlc: jsonApi.Joi.string()
      .description("The MAC address of the plc.")
      .example("00:CA:F1:4B:DE:11"),
    label: jsonApi.Joi.string().required()
      .description("The label <Country>.<Location>.<Building>.<Floor>.<Room>.<Row>.<DP>.<PrimaryOrSec>")
      .example("US.MSC.01.01.0001.01.02.1"),
    plcStatus: jsonApi.Joi.string()
      .description("Is the plc up or down or some other status.")
      .example("OK"),
    plcScanEnabled: jsonApi.Joi.boolean().required()
      .description("Should the driver try to connect and scan the plc.")
      .example("FALSE"),
    racks: jsonApi.Joi.many("racks")
      .description("All of the racks associated with this DP"),
    tags: jsonApi.Joi.many("tags")
      .description("All of the common tags associated with this DP"),
    rpp: jsonApi.Joi.belongsToOne({
      resource: "rpps",
      as: "dps"
    })
  },
  examples: [{}]
});
