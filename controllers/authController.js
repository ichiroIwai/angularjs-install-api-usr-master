'use strict';

var userService = require('../services/userService'),
    responseHelper  = require('../helpers/responseHelper');

module.exports.login = function(req, res, next) {
  userService.login(req.body, false, function (err, result) {
    if (err) {
      return next(err);
    }

    responseHelper.successResponse(res, {
      token     : result.token.token,
      technician: result.userData
    });
  });
};

module.exports.checkToken = function(req, res, next) {
  responseHelper.successResponse(res, { user: req.user, ping: req.body.ping });
};

module.exports.adminLogin = function(req, res, next) {
  // Set flag for standard responses handling
  req.standardRes = true;

  userService.login(req.body, true, function (err, result) {
    if (err) {
      return next(err);
    }

    res.json({
      token: result.token.token,
      admin: result.userData
    });
  });
};
