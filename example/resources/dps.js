var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "dps",
  description: "Represents a Distribution Power Panel.",
  handlers: new MongoStore({
    //url: "mongodb://localhost:27017/",
    url: "mongodb://swagger:swagger1234@bigharddoors.com:27017/?ssl=true",
  }),
  searchParams: {},
  attributes: {
     name: jsonApi.Joi.string().required()
      .description("The panel name.")
      .example("DP01A"),
     ipAddressPlc: jsonApi.Joi.string().required()
      .description("The IP address of the plc.")
      .example("10.10.10.12"),
     macAddressPlc: jsonApi.Joi.string()
      .description("The MAC address of the plc.")
      .example("00:CA:F1:4B:DE:11"),
     label: jsonApi.Joi.string().required()
      .description("The label <Country>.<Location>.<Building>.<Floor>.<Room>.<Row>.<DP>.<PrimaryOrSec>")
      .example("US.MSC.01.01.0001.01.02.1"),
     racks: jsonApi.Joi.many("racks")
      .description("All of the racks associated with this DP")
      .optional(),
     rpp: jsonApi.Joi.belongsToOne({
      resource: "rpps",
      as: "dps"
    }).optional()

  },
  examples: [
    {
            id: "753334de-4986-4597-81b9-cf31b6762486",
            type: "dps",
            label: "US.MSC.01.02.0001.01.02.1",
            ipAddressPlc: "10.10.10.12",
            macAddressPlc: "00:CA:F1:AB:A9:42",
            racks: [
              { type: "racks", id: "7541a4de-4986-4597-81b9-cf31b4859486" }
            ]
        }
  ]
});
