'use strict';

var sapService = require('../services/sapService'),
    config     = require('../config'),
    logger     = require('../config/logger'),
    models     = require('../models'),
    async      = require('async'),
    errors     = require('../lib/errors'),
    User       = models.User;

module.exports.getUserData = function(username, sapUsername, callback) {
  async.waterfall([
    function(callback) {
      getUserDataFromDB(username, callback);
    },
    function(userData, callback) {
      if (userData !== null) {
        logger.info("Found user data for " + username + " in the database");
        return callback(null, userData);
      }
      if (sapUsername === null) {
        return callback(new errors.BadRequestError('User data could not be retrieved, please login again'));
      }
      getUserDataFromSAP(username, sapUsername, callback);
    }
  ], function(error, userData) {
    if (error) {
      return callback(error);
    }

    callback(null, userData);
  });
};

var getUserDataFromDB = function(username, callback) {
  User.findOne({
    where: { username: username },
    attributes: ['id', 'sapUsername', 'firstName', 'lastName', 'techCertId', 'lastUpdate', 'isAdmin'],
    raw: true
  }).then(function(userData) {
    var minLastUpdateDate = new Date(new Date().getTime() - config.userData.validTime * 1000);
    if (userData === null || userData.lastUpdate <= minLastUpdateDate) {
      callback(null, null);
    } else {
      callback(null, userData);
    }
  }).error(function(error) {
    callback(error, null);
  });
};

var getUserDataFromSAP = function(username, sapUsername, callback) {
  sapService.callUserGetDetailWS(sapUsername, function(err, userData) {
    if (err) {
      return callback(err, null);
    }

    setDefaults(userData);
    if (userData.techCertId == "") {
      return callback(new errors.ForbiddenError("User has no Technician Certification ID"));
    }

    // retrieved information from SAP, now we have to store it
    logger.info("Found user data for " + username + " in SAP, going to store it locally");
    User.upsert({
      username: username,
      sapUsername: sapUsername,
      lastUpdate: new Date(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      techCertId: userData.techCertId
    }).then(function(res) {
      getUserDataFromDB(username, callback);
    }).catch(function(error) {
      callback(error, null);
    })
  });
};

var setDefaults = function(userData) {
  var defaults = {
    techCertId    : "defaultServiceTechId",
    firstName     : "defaultFirstName",
    lastName      : "defaultLastName"
  };

  for (var k in defaults) {
    if (config.sap[defaults[k]]) {
      userData[k] = config.sap[defaults[k]];
    }
  }
}