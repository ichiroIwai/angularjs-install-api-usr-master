'use strict';

var _  = require('lodash');

var logger = require('../config/logger'),
    errors = require('../lib/errors'),
    responseHelper = require('../helpers/responseHelper');

module.exports = function (err, req, res, next) {
  if (err) {
    logger.error(err);

    if (req.standardRes) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    if (err instanceof errors.ApiError) {
      responseHelper.errorResponse(res, err);
    } else if (err instanceof Error) {
      err.statusCode = 500;
      responseHelper.errorResponse(res, err);
    } else {
      responseHelper.errorResponse(res, {
        statusCode: 500,
        message   : 'Internal server error'
      });
    }
  }
};
