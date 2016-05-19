/* @flow weak */
"use strict";
var swagger = module.exports = { };

var router = require("../router.js");
var swaggerGenerator = require("../swagger");
var jsonApi = require("../../");
var fs = require("fs");

swagger.register = function() {
  if (!jsonApi._apiConfig.swagger) return;

  router.bindRoute({
    verb: "get",
    path: "swagger.json"
  }, function(request, resourceConfig, res) {
    //Check to see if the swagger file has already been read in.
    if (!swagger._cache) {
      var content;
      // It is not in memory so lets try to read it from disk.
      fs.readFile('./apple/swagger/swagger.json','utf8', function read(err, data) {
        if (err) {
          //Could not read it from disk so lets generate it based on our resources file
          swagger._cache = JSON.stringify(swaggerGenerator.generateDocumentation());
          //console.log(swagger._cache);
          //Lets write it out so we can have access to this file in the file system.
          fs.writeFileSync('./apple/swagger/swagger.json',swagger._cache,'utf8');
        } else {
          swagger._cache = data;
        }
        // Send our stringifed swagger.json file.
        //console.log(res.json(swagger._cache));   // Put all of the code here (not the best solution)
        return res.send(swagger._cache);
        //return res.write(JSON.stringify(swagger._cache));        
      });
      //swagger._cache = swaggerGenerator.generateDocumentation();
    }else
      //The swagger.json file was already cached so just return it.
      return res.send(swagger._cache);
  });
};
