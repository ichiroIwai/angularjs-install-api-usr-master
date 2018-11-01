'use strict';

var errors = require('../lib/errors');

module.exports = function (req, res, next) {
  if (! res.headersSent) {
    next(new errors.NotFoundError('Route not found: ' + req.url));
  }
};
