'use strict';

var logger     = require('../config/logger'),
    logService = require('../services/actionsLogService');

module.exports = function (err, req, res, next) {
  console.log('actionsLogErrorMiddleware');
  if (req.info) {
    logService.logActionError(req.path, req.info, req.user, function (err) {
      if (err) {
        logger.error("Error while adding error entry to actions log: " + err.message);
      }
    });
  }

  // Move into the next middleware, if any
  next(err);
};
