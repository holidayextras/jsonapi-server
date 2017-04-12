var jsonApi = require('../../.');
var MongoStore = require('../../../jsonapi-store-mongodb');
//var rppHandler = require("../handlers/rppHandler.js");
const REGEX_MAC_ADDRESS = /^(([A-Fa-f0-9]{2}[:]){5}[A-Fa-f0-9]{2}[,]?)+$/i;

jsonApi.define({
  namespace: "json:api",
  resource: "hosts",
  description: "Represents device that has tags attached.",
  handlers: new MongoStore({
    url: process.env.MONGO_URL
  }),
  searchParams: {},
  attributes: {
    id: jsonApi.Joi.string().default(jsonApi.Joi.ref('_id')),
    _id: jsonApi.Joi.string(),
    hostnameOrIP: jsonApi.Joi.string().trim().hostname().required()
      .description("The hostname or ip of the host which is running this scada software.")
      .example("my.cool.host.com"),
    macAddress: jsonApi.Joi.string().trim().uppercase().regex(REGEX_MAC_ADDRESS).optional()
      .description("The host mac address.")
      .example("00:00:00:00:00:00"),
    desc: jsonApi.Joi.string().required()
      .description("The description <Country>.<Location>.<Building>.<Floor>.<Room>.<Row>.<DP>.<PrimaryOrSec>")
      .example("US.MSC.01.01.0001.01.02.1"),
    isPrimary: jsonApi.Joi.boolean().default(true)
      .description("Is this the primary host.")
      .example("true")
  },
  examples: [{}]
});
