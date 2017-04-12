var jsonApi = require('../../.');
var MongoStore = require('../../../jsonapi-store-mongodb');
//var rppHandler = require("../handlers/rppHandler.js");
const REGEX_NAME_STRING = /^[A-Z|a-z0-9_%][^\s*\\?;{}[\]|`'"]*$/gi;
const REGEX_MAC_ADDRESS = /^(([A-Fa-f0-9]{2}[:]){5}[A-Fa-f0-9]{2}[,]?)+$/i;
const REGEX_DRIVER = /(^modbus$)$/gi;

jsonApi.define({
  namespace: "json:api",
  resource: "devices",
  description: "Represents device that has tags attached.",
  handlers: new MongoStore({
    url: process.env.MONGO_URL
  }),
  searchParams: {},
  attributes: {
    id: jsonApi.Joi.string().default(jsonApi.Joi.ref('_id')),
    _id: jsonApi.Joi.string(),
    name: jsonApi.Joi.string().trim().regex(REGEX_NAME_STRING)
      .description("Whatever you want to call this device.")
      .example("MY_COOL_AB_PLC"),
    cabinet: jsonApi.Joi.string().required()
      .description("The cabinet number (0-5).")
      .example("1"),
    rack: jsonApi.Joi.string().required()
      .description("The rack number (1-50).")
      .example("1"),
    driver: jsonApi.Joi.string().trim().default('modbus').regex(REGEX_DRIVER)
      .description("The type of driver used to talk to this device.")
      .example("modbus"),
    port: jsonApi.Joi.number().min(1).max(65535).integer().required()
      .description("The port that the device listens on.")
      .example("502"),
    hostnameOrIP: jsonApi.Joi.string().trim().hostname().required()
      .description("The hostname or ip of this device.")
      .example("my.cool.plc"),
    macAddress: jsonApi.Joi.string().trim().uppercase().regex(REGEX_MAC_ADDRESS).optional()
      .description("PLC mac address.")
      .example("00:00:00:00:00:00"),
    desc: jsonApi.Joi.string().required()
      .description("The description <Country>.<Location>.<Building>.<Floor>.<Room>.<Row>.<DP>.<PrimaryOrSec>")
      .example("US.MSC.01.01.0001.01.02.1"),
    status: jsonApi.Joi.string().optional()
      .description("Is the plc up or down or some other status.")
      .example("OK"),
    scanEnabled: jsonApi.Joi.boolean().default(true)
      .description("Should the driver try to connect and scan the plc.")
      .example("FALSE")
  },
  examples: [{}]
});
