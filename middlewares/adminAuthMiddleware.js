'use strict';

var config = require('../config');

var userService = require('../services/userService'),
    config      = require('../config'),
    errors      = require('../lib/errors');

module.exports = function (req, res, next) {
  // Set flag for standard responses handling
  req.standardRes = true;

  var token = req.headers[config.token.headerName];

  if (! token) {
    return next(new errors.UnauthorizedError('No token was provided'));
  }

  userService.validateToken(token, function (err, tokenData) {
    if (err) {
      return next(err);
    }

    userService.getData(tokenData.username, null, function (err, userData) {
      if (err) {
        return next(err);
      }

      // Check if user is admin before sending response,
      if (! userData.isAdmin) {
        return next(new errors.ForbiddenError('User is not allowed to access admin resources'));
      }

      req.user = userData;
      next();
    });
  });
};
