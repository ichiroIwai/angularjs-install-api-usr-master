'use strict';

var _     = require('lodash'),
    async = require('async'),
    mmm   = require('mmmagic'),
    Magic = mmm.Magic,
    Joi   = require('joi');

var models       = require('../models'),
    config       = require('../config'),
    imageService = require('./imageService'),
    sapService   = require('./sapService'),
    errors       = require('../lib/errors'),
    errorCodes   = require('../helpers/errorCodes');

var magic = new Magic(mmm.MAGIC_MIME_TYPE);

var validateLocationParamsSchema = Joi.object().keys({
  location     : Joi.object().keys({
    latitude : Joi.number().precision(12).min(-90).max(90).required(), // A number between [-90, 90]
    longitude: Joi.number().precision(12).min(-180).max(180).required(), // A number between [-180, 180]
  }),
  serialNumber : Joi.string().min(1).required() // A string of at least one char
});

var updateLocationPayloadSchema = Joi.object().keys({
  location     : Joi.object().keys({
    latitude : Joi.number().precision(12).min(-90).max(90).required(), // A number between [-90, 90]
    longitude: Joi.number().precision(12).min(-180).max(180).required(), // A number between [-180, 180]
  }),
  serialNumber: Joi.string().min(1).required(), // A string of at least one char
  confirmCheck: Joi.boolean().required()
});

var correctiveActionParamsSchema = Joi.object().keys({
  correctiveAction  : Joi.string().min(1).required(), // A string of at least one char
  notificationNumber: Joi.string().min(6).required() // A positive integer number
});

module.exports.validateLocation = function (params, user, callback) {
  async.waterfall([
    function (callback) {
      // Check params validity
      Joi.validate(params, validateLocationParamsSchema, function (err, validatedParams) {
        if (err) {
          var errorCode = errorCodes.getErrorCode(err);
          return callback(new errors.BadRequestError('The structure of the params is invalid', errorCode));
        }
        callback(null, validatedParams);
      });
    },
    function (params, callback) {
      params.serviceTechId = user.techCertId;
      sapService.callValidateLocationWS(params, callback);
    }
  ], callback);
};

module.exports.sendUpdateLocation = function (image, payload, user, callback) {
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
        Joi.validate(payload, updateLocationPayloadSchema, function (err, validatedParams) {
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
        latitude : params.location.latitude,
        longitude: params.location.longitude
      };

      imageService.addExifData(image.path, exifParams, function (error) {
        callback(error, image.path, params);
      });
    },
    function (imagePath, params, callback) {
      params.serviceTechId = user.techCertId;
      sapService.callUpdateLocationWS(params, imagePath, callback);
    }
  ], callback);
};

module.exports.sendCorrectiveAction = function (params, user, callback) {
  async.waterfall([
    function (callback) {
      Joi.validate(params, correctiveActionParamsSchema, function (err, validatedParams) {
        if (err) {
          var errorCode = errorCodes.getErrorCode(err);
          return callback(new errors.BadRequestError('The structure of the params is invalid', errorCode));
        }
        callback(null, validatedParams);
      });
    },
    function (params, callback) {
      sapService.callCorrectiveActionWS(params, callback);
    }

  ], callback);
};
