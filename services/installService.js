'use strict';

var _      = require('lodash'),
    async  = require('async'),
    moment = require('moment'),
    mmm    = require('mmmagic'),
    Magic  = mmm.Magic,
    Joi    = require('joi');

var models       = require('../models'),
    config       = require('../config'),
    imageService = require('./imageService'),
    sapService   = require('./sapService'),
    errors       = require('../lib/errors'),
    errorCodes   = require('../helpers/errorCodes');

var magic = new Magic(mmm.MAGIC_MIME_TYPE);

var machineDetailsPayloadSchema = Joi.object().keys({
  lat         : Joi.number().precision(12).min(-90).max(90).required(), // A number between [-90, 90]
  lon         : Joi.number().precision(12).min(-180).max(180).required(), // A number between [-180, 180]
  serialNumber: Joi.string().min(1).required(),
  failedPhoto : Joi.boolean().required()
});

var activationCodeParamsSchema = Joi.object().keys({
  macAddress     : Joi.string().min(1).required(),
  machineCode    : Joi.string().min(1).required(),
  serialNumber   : Joi.string().min(1).required(),
  softwareVersion: Joi.string().min(1).required()
});

module.exports.sendMachineDetails = function (image, payload, user, callback) {
  if (! image) {
    return callback(new errors.BadRequestError('No image was uploaded', 'photo'));
  }

  async.waterfall([
    function (callback) {
      // Check image mime type
      magic.detectFile(image.path, function (err, result) {
        if (! _.includes(config.imageUploads.supportedFormats, result)) {
          return callback(new errors.BadRequestError('Invalid mime type for image', 'photo'));
        }

        callback();
      });
    },
    function (callback) {
      // Check payload validity
      try {
        var params = JSON.parse(payload);
        Joi.validate(payload, machineDetailsPayloadSchema, function (err, validatedParams) {
          if (err) {
            var errorCode = errorCodes.getErrorCode(err);
            return callback(new errors.BadRequestError('The structure of the payload is invalid', errorCode));
          }
          callback(null, validatedParams);
        });
      } catch (error) {
        callback(new errors.BadRequestError('Error parsing payload'));
      }
    },
    function (params, callback) {
      var exifParams = {
        latitude : params.lat,
        longitude: params.lon
      };

      imageService.addExifData(image.path, exifParams, function (error) {
        callback(error, image.path, params);
      });
    },
    function (imagePath, params, callback) {
      params.username = user.sapUsername;
      params.timestamp = moment().unix();
      sapService.callMachineDetailsWS(params, imagePath, callback);
    }
  ], callback);
};

module.exports.postActivationCode = function (params, user, callback) {
  async.waterfall([
    function (callback) {
      // Check params validity
      Joi.validate(params, activationCodeParamsSchema, function (err, validatedParams) {
        if (err) {
          var errorCode = errorCodes.getErrorCode(err);
          return callback(new errors.BadRequestError('The structure of the params is invalid', errorCode));
        }
        callback(null, validatedParams);
      });
    },
    function (params, callback) {
      params.serviceTechId = user.techCertId;
      params.userName = user.sapUsername;
      params.timeStamp = moment().unix();
      sapService.callActivationCodeWS(params, callback);
    }
  ], callback);
};
