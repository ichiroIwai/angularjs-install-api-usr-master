'use strict';

var validationService = require('../services/validationService'),
    responseHelper    = require('../helpers/responseHelper');

module.exports.postValidateLocation = function(req, res, next) {
  var params = req.body;

  validationService.validateLocation(params, req.user, function (error, logInfo, notificationNumber, result) {
    req.info = logInfo;

    if (error) {
      return next(error);
    }

    responseHelper.successResponse(res, {
      notification: notificationNumber
    }, result);
    next();
  });
};

module.exports.postUpdateLocation = function(req, res, next) {
  var image = req.file;
  var payload = req.body.payload;

  validationService.sendUpdateLocation(image, payload, req.user, function (error, logInfo, notificationNumber) {
    req.info = logInfo;

    if (error) {
      return next(error);
    }

    responseHelper.successResponse(res, {
      sap_notification: notificationNumber
    });
    next();
  });
};

module.exports.postCorrectiveAction = function(req, res, next) {
  var params = req.body;

  validationService.sendCorrectiveAction(params, req.user, function (error, logInfo, notificationNumber) {
    req.info = logInfo;

    if (error) {
      return next(error);
    }

    responseHelper.successResponse(res, {});
    next();
  });
};
