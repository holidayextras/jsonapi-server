var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "tags",
  description: "Represents a tag.",
  handlers: new MongoStore({
    //url: "mongodb://localhost:27017/",
    // url: "mongodb://swagger:swagger1234@localhost:27017/Apple",
    url: process.env.MONGO_URL
  }),
  searchParams: {},
  attributes: {
     tagPrefix: jsonApi.Joi.string().required()
      .description("The tag prefix name.")
      .example("DP01A"),
     cabinetNum: jsonApi.Joi.string().required().allow('')
      .description("The cabinet number of 1 - 35 or rpp.")
      .example("1"),
     rackNum: jsonApi.Joi.string().required().allow('')
      .description("The rack number of 1 - 5 or local")
      .example("1"),
     circuitNum: jsonApi.Joi.string().required().allow('')
      .description("The circuit number of 1 or 2.")
      .example("1"),
     phase: jsonApi.Joi.string().optional().allow('')
      .description("Phase A, B, or C")
      .example("A"),
     memLocation: jsonApi.Joi.string().required()
      .description("PLC memory location.")
      .example("N21:0"),
     postTagname: jsonApi.Joi.string().required()
      .description("The tag suffix name.")
      .example("CB1_CR1_PHA_Volts"),
     tagname: jsonApi.Joi.string().required()
      .description("The tagPrefix_postTagname.")
      .example("DP01a_CB1_CR1_PHA_Volts"),
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
     dataQuality: jsonApi.Joi.string()
      .description("The data quality of the value of this tag.")
      .example("Ok"),
     value: jsonApi.Joi.number()
      .description("The current value of the tag in engineering units.")
      .example("24.5"),
     input: jsonApi.Joi.number()
      .description("If tag is writeable, the value to write to the tag in engineering units.")
      .example("24.5"),
     lastUpdate: jsonApi.Joi.date()
      .description("The last time the current value was updated in UNIX time (ms).")
      .example("1463776147123"),
     histDeadbandPercent: jsonApi.Joi.number()
      .description("The percent of change of value field required to trigger a history sample where .03 is 3%. 0 means collect everything.")
      .example(".03"),
     circuit: jsonApi.Joi.belongsToOne({
      resource: "circuits",
      as: "tags"
      }).optional(),
     rpp: jsonApi.Joi.belongsToOne({
      resource: "rpps",
      as: "tags"
     }).optional(),
     dp: jsonApi.Joi.belongsToOne({
      resource: "dps",
      as: "tags"
      }).optional()
  },
  examples: [{}]
});
