var jsonApi = require("../../.");
var MongoStore = require("../../../jsonapi-store-mongodb");
//var rppHandler = require("../handlers/rppHandler.js");

jsonApi.define({
  namespace: "json:api",
  resource: "settings",
  description: "Global RPP settings used by all applications.",
  handlers: new MongoStore({
    url: process.env.MONGO_URL
  }),
  searchParams: {},
  attributes: {
    id: jsonApi.Joi.string().default(jsonApi.Joi.ref('_id')),
    _id: jsonApi.Joi.string(),
     ldapUrl: jsonApi.Joi.string().required().default("ldap://ldapserver.spscada.local:389")
      .description("Ldap server url.")
      .example("ldap://ldapserver.spscada.local:389"),
    ldapBaseDN: jsonApi.Joi.string().required().default("dc=spscada,dc=local")
      .description("Ldap base dn.")
      .example("dc=spscada,dc=local"),
    ldapBindDN: jsonApi.Joi.string().required().default("cn=Manager,dc=spscada,dc=local")
      .description("Ldap bind dn.")
      .example("cn=Manager,dc=spscada,dc=local"),
    ldapBindPass: jsonApi.Joi.string().required().default("charger.")
      .description("Ldap server bind password.")
      .example("password"),
    ldapTemplate: jsonApi.Joi.string().required().default("(uid=%(username)s)")
      .description("Ldap server template.")
      .example("(uid=%(username)s)"),
    jwtSecret: jsonApi.Joi.string().required().default("jwt.secret.apple.rpp.key")
      .description("JSON web token private key.")
      .example("my.private.jwt.key.secret"),
    updateServer: jsonApi.Joi.string().required().default("rpp.update.server.com")
      .description("The server that is server RPP software updates.")
      .example("rpp.update.server.com"),
    installedVersion: jsonApi.Joi.string().required().default("v0.0.0")
      .description("Current RPP software version installed.")
      .example("v1.0.0"),
    updateVersion: jsonApi.Joi.string().required().default("v0.0.0")
      .description("The version of RPP software you want to install.")
      .example("v1.0.1"),
    pin: jsonApi.Joi.number().integer().required().default(1234)
      .description("The pin to login to the RPP. This will work even if no ldap server is available.")
      .example("1234")
  },
  examples: [
    {
    }
  ]
});
