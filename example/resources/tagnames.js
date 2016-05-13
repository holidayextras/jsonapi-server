var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var tagNamesHandler = require("../handlers/tagNamesHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "TagNames",
  description: "Represents the plc modbus tag for a specific plc value.",
  handlers: new MongoStore({
    url: "mongodb://localhost:27017/",
  }),
  searchParams: {},
  attributes: {
    objectId: jsonApi.Joi.string().required()
      .description("The unique id")
      .example("Qz4a9dcdpx"),
    dpName: jsonApi.Joi.string().required()
      .description("The Distribution Panel number.")
      .example("DP01A"),
    createdAt: jsonApi.Joi.string()
      .description("The date on which the tag name was created, YYYY-MM-DDTHH:MM:SS.sssA")
      .example("2016-05-03T23:19:30.314Z"),
    updatedAt: jsonApi.Joi.string()
      .description("The date on which the tag name was created, YYYY-MM-DDTHH:MM:SS.sssA")
      .example("2016-05-03T23:19:30.314Z"),
    label: jsonApi.Joi.string().required()
      .description("The label <Country>.<Location>.<Building>.<Floor>.<Room>.<Row>.<Cabinet>.<Phase>")
      .example("US.MSC.01.01.0001.01.001.1"),
    tagName: jsonApi.Joi.string().required()
      .description("The unique tag name")
      .example("DP01A_RA1_CR1_PHC_Amps"),
    value: jsonApi.Joi.string().required()
      .description("The current tag value.")
      .example("24.0"),
    ModbusAddress: jsonApi.Joi.string().required()
      .description("The modbus address of the tag.")
      .example("420003"),
    ipAddress: jsonApi.Joi.string().required()
      .description("The ip address of the plc where the tag lives.")
      .example("10.10.10.11"),
    macAddress: jsonApi.Joi.string().required()
      .description("The MAC address of the linux box.")
      .example("00:CA:F1:4B:A9:42")
  },
  examples: [
    {
            id: "de305d54-75b4-431b-adb2-eb6b9e546015",
            type: "TagNames",
            objectId: "Qz4a9dcdpx",
            dpName: "DP01A",
            updatedAt: "2016-05-03T23:19:30.314Z",
            createdAt: "2016-05-03T21:03:50.589Z",
            label: "US.MSC.01.02.0001.01.002.1",
            tagName: "DP01A_RA1_CR1_PHC_Amps",
            value: "19.6",
            ModbusAddress: "420003",
            ipAddress: "10.10.10.11",
            macAddress: "00:CA:F1:4B:A9:42"
        },
        {
            objectId: "Uxgd9iMbc6",
            id: "de305d54-75b4-431b-adb2-eb6b9e546015",
            dpName: "DP01A",
            type: "TagNames",
            updatedAt: "2016-05-03T23:19:34.749Z",
            createdAt: "2016-05-03T21:03:01.247Z",
            label: "US.MSC.01.02.0001.01.002.1",
            tagName: "DP01A_RA1_CR1_PHB_Amps",
            value: "19.4",
            ModbusAddress: "420002",
            ipAddress: "10.10.10.11",
            macAddress: "00:CA:F1:4B:A9:43"
        },
        {
            objectId: "2iEWTPxA3M",
            id: "de305d54-75b4-431b-adb2-eb6b9e546015",
            dpName: "DP01A",
            type: "TagNames",
            updatedAt: "2016-05-03T23:19:38.797Z",
            createdAt: "2016-05-03T20:21:06.096Z",
            label: "US.MSC.01.02.0001.01.002.1",
            tagName: "DP01A_RA1_CR1_PHA_Watts",
            value: "602",
            ModbusAddress: "420005",
            ipAddress: "10.10.10.11",
            macAddress: "00:CA:F1:4B:A9:44"
        },
        {
            objectId: "U9Ttc3MERL",
            id: "de305d54-75b4-431b-adb2-eb6b9e546015",
            type: "TagNames",
            dpName: "DP01A",
            updatedAt: "2016-05-03T23:19:42.387Z",
            createdAt: "2016-05-03T20:07:55.090Z",
            label: "US.MSC.01.02.0001.01.002.1",
            tagName: "DP01A_RA1_CR1_Votls_L-L",
            value: "479.2",
            ModbusAddress: "420004",
            ipAddress: "10.10.10.11",
            macAddress: "00:CA:F1:4B:A9:45"
        },
        {
            objectId: "s4WBTvkE60",
            id: "de305d54-75b4-431b-adb2-eb6b9e546015",
            type: "TagNames",
            dpName: "DP01A",
            updatedAt: "2016-05-03T23:19:46.511Z",
            createdAt: "2016-05-03T20:03:08.994Z",
            label: "US.MSC.01.02.0001.01.002.1",
            tagName: "DP01A_RA1_CR1_PHA_Amps",
            value: "19.5",
            ModbusAddress: "420001",
            ipAddress: "10.10.10.11",
            macAddress: "00:CA:F1:4B:A9:46"
        }
  ]
});
