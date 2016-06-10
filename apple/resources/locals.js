var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");
//
jsonApi.define({
  namespace: "json:api",
  resource: "locals",
  description: "Represents the tags local to an RPP or a DP.",
  handlers: new MongoStore({
    //url: "mongodb://localhost:27017/",
    //url: "mongodb://swagger:swagger1234@localhost:27017/Apple?ssl=true",
    url: "mongodb://swagger:swagger1234@localhost:27017/Apple",
  }),
  searchParams: {},
  attributes: {
     tags: jsonApi.Joi.many("tags")
      .description("All of the local tags associated with this DP or RPP."),
     rpp: jsonApi.Joi.belongsToOne({
      resource: "rpps",
      as: "local"
    }).optional(),
     dp: jsonApi.Joi.belongsToOne({
      resource: "dps",
      as: "local"
    }).optional()
  },
  examples: [{}]
});
