'use strict';

var installService = require('../services/installService'),
    responseHelper = require('../helpers/responseHelper');

module.exports.postMachineDetails = function(req, res, next) {
  var image = req.file;
  var payload = req.body.payload;

  installService.sendMachineDetails(image, payload, req.user, function (error, logInfo, machineDetails) {
    req.info = logInfo;

    if (error) {
      return next(error);
    }

    responseHelper.successResponse(res, machineDetails);
    next();
  });
};

module.exports.postActivationCode = function(req, res, next) {
  var params = req.body;

  installService.postActivationCode(params, req.user, function (error, logInfo, successResult) {
    req.info = logInfo;

    if (error) {
      return next(error);
    }

    responseHelper.successResponse(res, successResult);
    next();
  });
};
