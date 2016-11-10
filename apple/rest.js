/**
 * REST request class
 * Created by jbockerstette on 11/8/16.
 */
var http = require("http");
var https = require("https");

/**
 * getJSON:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param onResult: callback to pass the results JSON object(s) back
 */
exports.getJSON = function(options, onResult)
{
  console.log("rest::getJSON");

  // var prot = options.port == 443 ? https : http;
  var prot = http;
  var req = prot.request(options, function(res)
  {
    var output = '';
    console.log(options.host + ':' + res.statusCode);
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      output += chunk;
    });

    res.on('end', function() {
      onResult(res.statusCode, output);
    });
  });

  req.on('error', function(err) {
    //res.send('error: ' + err.message);
  });

  req.end();
};
