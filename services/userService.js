'use strict';

var authService = require('./ldapAuthService'),
    dataService = require('./userDataService'),
    sapService  = require('./sapService'),
    async       = require('async'),
    errors      = require('../lib/errors');

module.exports.getData = dataService.getUserData;
module.exports.validateToken = authService.validateToken;

module.exports.login = function (params, adminLogin, callback) {
  var authToken;
  async.waterfall([
    function(callback) {
      authService.loginUser(params, callback);
    },
    function(token, callback) {
      authToken = token;
      sapService.callADToSAPLoginWS(params.user, callback);
    },
    function(sapLogin, callback) {
      dataService.getUserData(params.user, sapLogin, callback);
    }
  ], function(error, userData) {
    if (error) {
      return callback(error);
    }

    // Check if user is admin before sending response
    if (adminLogin && !userData.isAdmin) {
      return callback(new errors.ForbiddenError('User is not allowed to access admin resources'));
    }

    callback(null, {
      token: authToken,
      userData: userData
    });
  });
};
