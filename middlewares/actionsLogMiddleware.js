'use strict';

var errors     = require('../lib/errors'),
    logger     = require('../config/logger'),
    logService = require('../services/actionsLogService');

module.exports = function (req, res, next) {
  if (req.info) {
    logService.logActionSuccess(req.path, req.info, req.user, function (err) {
      // Response was already sent to user at this point, there's no point on
      // attempting to handle the error. Notice that also we don't care about
      // async flow, as it doesn't make much sense here
      if (err) {
        logger.error("Error while adding entry to actions log: " + err.message);
      }
    });
  }

  // Move into the next middleware, if any
  next();
};
