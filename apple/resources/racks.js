var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "racks",
  description: "Represents a Rack.",
  handlers: new MongoStore({
    //url: "mongodb://localhost:27017/",
    url: "mongodb://swagger:swagger1234@bigharddoors.com:27017/Apple/?ssl=true",
  }),
  searchParams: {},
  attributes: {
     rack: jsonApi.Joi.string().required()
      .description("The rack number 0-5.")
      .example("0"),
     cabinet: jsonApi.Joi.string().required()
      .description("The cabinet number 1-35.")
      .example("1"),
     circuits: jsonApi.Joi.many("circuits")
      .description("All of the circuits associated with this rack. RACK0 will have no circuits."),
     tags: jsonApi.Joi.many("tags")
      .description("All of the tags associated with this rack. Only RACK0 will have tags."),
     dps: jsonApi.Joi.belongsToMany({
      resource: "dps",
      as: "racks"
    })
  },
  examples: [
    {
            id: "7541a4de-4986-4597-81b9-cf31b4859486",
            type: "racks",
            name: "RACK1",
            circuits: [
              { type: "circuits", id: "1234a4de-4986-4597-81b9-cf31b4859486" }
            ],
            tags: []
        }
  ]
});
