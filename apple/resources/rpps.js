var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "rpps",
  description: "Represents a Remote Power Panel.",
  handlers: new MongoStore({
    //url: "mongodb://localhost:27017/",
    url: "mongodb://swagger:swagger1234@bigharddoors.com:27017/Apple/?ssl=true",
  }),
  searchParams: {},
  attributes: {
    ipAddressPlc: jsonApi.Joi.string().required()
      .description("The IP address of the plc.")
      .example("10.10.10.10"),
    macAddressPlc: jsonApi.Joi.string()
      .description("The MAC address of the plc.")
      .example("00:CA:F1:4B:A9:42"),
    ipAddressHost: jsonApi.Joi.string()
      .description("The IP address of the linux host.")
      .example("10.10.10.1"),
    macAddressHost: jsonApi.Joi.string()
      .description("The MAC address of the linux host.")
      .example("00:CA:F1:4B:A9:42"),
    label: jsonApi.Joi.string().required()
      .description("The label <Country>.<Location>.<Building>.<Floor>.<Room>.<Row>")
      .example("US.MSC.01.01.0001.01"),
    local: jsonApi.Joi.one("locals")
      .description("All of the local tags associated with this RPP"),
    dps: jsonApi.Joi.many("dps")
      .description("All of the DPs associated with this RPP")
  },
  examples: [{}]
});
