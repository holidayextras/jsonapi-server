var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "tags",
  description: "Represents a tag.",
  handlers: new MongoStore({
    //url: "mongodb://localhost:27017/",
    url: "mongodb://swagger:swagger1234@bigharddoors.com:27017/Apple/?ssl=true",
  }),
  searchParams: {},
  attributes: {
     tagPrefix: jsonApi.Joi.string().required()
      .description("The tag prefix name.")
      .example("DP01A"),
     circuit: jsonApi.Joi.string().required()
      .description("The circuit number of 1 or 2.")
      .example("1"),
     phase: jsonApi.Joi.string().required()
      .description("Phase A, B, or C")
      .example("A"),
     memLocation: jsonApi.Joi.string().required()
      .description("PLC memory location.")
      .example("N21:0"),
     postTagname: jsonApi.Joi.string().required()
      .description("The tag suffix name.")
      .example("CB1_CR1_PHA_Volts"),
     description: jsonApi.Joi.string().required()
      .description("The tag description.")
      .example("Volts from TrendPoint."),
     units: jsonApi.Joi.string().required()
      .description("The tag units.")
      .example("Volts"),
     isWritable: jsonApi.Joi.boolean().required()
      .description("Can you write to this tag.")
      .example("FALSE"),
     isEnabled: jsonApi.Joi.boolean().required()
      .description("Is this tag enabled. If false, then the tag will be ignored.")
      .example("TRUE"),
     isHistorical: jsonApi.Joi.boolean().required()
      .description("Should we store historical data for this tag.")
      .example("TRUE"),
     divider: jsonApi.Joi.number().required()
      .description("The tag value scaling factor to convert from raw counts to eng units.")
      .example("1000"),
     modbusAddress: jsonApi.Joi.number().integer()
      .description("The modbus address for this tag, must be an integer.")
      .example("44001"),
     history: jsonApi.Joi.many("history")
      .description("The timestamped history of the tag."),
     circuit: jsonApi.Joi.belongsToOne({
      resource: "circuits",
      as: "tags"
      }).optional(),
     rpp: jsonApi.Joi.belongsToOne({
      resource: "rpps",
      as: "tags"
      }),
     rack: jsonApi.Joi.belongsToOne({
      resource: "racks",
      as: "tags"
    })
  },
  examples: [
    {
            id: "6847a4de-1234-4597-81b9-cf31b4859486",
            type: "tags",
            circuitNumber: "1",
            phase: "A",
            memLocation: "N21:0",
            postTagname: "CB1_CR1_PHA_Volts",
            description: "Volts from TrendPoint.",
            units: "Volts",
            isWritable: "true",
            isEnabled: "true",
            isHistorical: "true",
            divider: "1000",
            modbusAddress: "44001"
        }
  ]
});
