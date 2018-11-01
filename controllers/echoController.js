'use strict';

var responseHelper = require('../helpers/responseHelper');

module.exports.echo = function(req, res, next) {
  responseHelper.successResponse(res, {
    username: req.user.username,
    request : req.body
  });
};
