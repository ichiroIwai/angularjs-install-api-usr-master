'use strict';

var config = require('../config');

var userService = require('../services/userService'),
    config      = require('../config'),
    errors      = require('../lib/errors');

module.exports = function (req, res, next) {
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

      req.user = userData;
      next();
    });
  });
};
