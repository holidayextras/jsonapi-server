var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");
const REGEX_LEVEL = /(^Critical$)|(^Info$)|(^Warning$)$/gi;
const REGEX_ALARM_TYPE = /(^HH$)|(^HI$)|(^LO$)|(^LL$)|(^INVALID$)$/gi;

jsonApi.define({
  namespace: "json:api",
  resource: "alarmDefs",
  description: "Alarm definition table for storing when to alarm on a tags value or status.",
  handlers: new MongoStore({
    url: process.env.MONGO_URL
  }),
  searchParams: {},
  attributes: {
    id: jsonApi.Joi.string().default(jsonApi.Joi.ref('_id')),
    _id: jsonApi.Joi.string(),
    tagId: jsonApi.Joi.string().required()
      .description("The tag this alarm def is for."),
    desc: jsonApi.Joi.string().trim()
      .description("The description of this alarm def.")
      .example("The water level is high"),
    level: jsonApi.Joi.string().insensitive().trim().regex(REGEX_LEVEL).default('Warning')
      .description("The alarm level severity.")
      .example("Critical"),
    alarmType: jsonApi.Joi.string().trim().uppercase().regex(REGEX_ALARM_TYPE).required()
      .description("The type of the alarm.")
      .example("HH"),
    setpoint: jsonApi.Joi.number().default(0)
      .description("The value that triggers the alarm.")
      .example("10"),
    deadband: jsonApi.Joi.number().default(0)
      .description("Once in alarm, the range for which the alarm is still active above or below " +
        "the setpoint.")
      .example(".1"),
    delay: jsonApi.Joi.number().integer().default(0)
      .description("The amount of time (seconds) which the tag value must exceed the setpoint " +
        "before an alarm will activate.")
      .example("10"),
    isEnabled: jsonApi.Joi.boolean().default(true)
      .description("If true the alarm will be processed, if false, the alarm will be ignored. ")
      .example("true"),
    autoReset: jsonApi.Joi.boolean().default(true)
      .description("If true the alarm will automatically go back to normal when cleared and acked.")
      .example("true"),
    autoAck: jsonApi.Joi.boolean().default(true)
      .description("If true the alarm will automatically ack when the alarm clears.")
      .example("true")
  },
  examples: [{}]
});
