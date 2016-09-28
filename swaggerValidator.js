const jsonApiTestServer = require("./example/server.js");
const request = require("request");
const assert = require("assert");

describe("Use a tool to validate the generated swagger document", () => {
  it("should not contain any errors", done => {
    const validator = require("swagger-tools").specs.v2;

    const uri = "http://localhost:16006/rest/swagger.json";
    request(uri, (meh, res, swaggerObject) => {
      swaggerObject = JSON.parse(swaggerObject);

      validator.validate(swaggerObject, (err, result) => {
        assert.ifError(err);

        if (!result) {
          console.log("Swagger document is valid");
          return done();
        }

        if (result.errors.length > 0) {
          console.log("The Swagger document is invalid...");
          console.log("");
          console.log("Errors");
          console.log("------");
          console.log(result.errors);
          console.log("");
        }

        if (result.warnings.length > 0) {
          console.log("Warnings");
          console.log("--------");
          console.log(result.warnings);
        }

        done(new Error("Invalid swagger.json!"));
      });
    });
  });

  before(() => {
    jsonApiTestServer.start();
  });
  after(() => {
    jsonApiTestServer.close();
  });
});
