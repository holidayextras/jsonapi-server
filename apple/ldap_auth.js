/**
 * A service to get jwt tokens for users from our ldap service at http://localhost:8888. This service is run as
 * a pm2 task from python rpp-scripts/ldap_auth_daemon.py
 *
 * Created by jbockerstette on 11/8/16.
 */

var rest = require("./rest.js");

/**
 * Convenience function to create http options for our ldap auth service running at http://localhost:8888.
 * This sets up the url, port and headers while expecting callers to set path and method
 * @param auth This is a string to be authorized by our ldap_auth_daemon.py. This string must be in one of two forms:
 * Form 1: auth="Basic amJvY2tlcnN0ZXR0ZTpjaGFyZ2VyLg==" where amJvY2tlcnN0ZXR0ZTpjaGFyZ2VyLg== is a base64 encoded
 * string such that decoded it would be simply user:pw.
 * Form 2: auth="Bearer jwt.web.token" where jwt.web.token is a valid webtoken which was originally returned by
 * successfully doing a GET -H "authorization:Basic amJvY2tlcnN0ZXR0ZTpjaGFyZ2VyLg==" http://localhost:8888
 */
var getAuthOptions = function(auth)
{
  var options = {
    host: 'localhost',
    port: 8888,
    path: '',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth
    }
  };

  return options;
};

/**
 * Rpp authorization:  Checks to see if the authorization header is a valid ldap user or a valid jwt token.
 * @param auth This is a string to be authorized by our ldap_auth_daemon.py. This string must be in one of two forms:
 * Form 1: auth="Basic amJvY2tlcnN0ZXR0ZTpjaGFyZ2VyLg==" where amJvY2tlcnN0ZXR0ZTpjaGFyZ2VyLg== is a base64 encoded
 * string such that decoded it would be simply user:pw.
 * Form 2: auth="Bearer jwt.web.token" where jwt.web.token is a valid webtoken which was originally returned by
 * successfully doing a GET -H "authorization:Basic amJvY2tlcnN0ZXR0ZTpjaGFyZ2VyLg==" http://localhost:8888
 * @param onResults: callback function for results
 */
exports.authorize = function(auth, onResults)
{
  console.log("authorize: " + auth);

  var options = getAuthOptions(auth);

  console.log(options);

  rest.getJSON(options, onResults);
};
