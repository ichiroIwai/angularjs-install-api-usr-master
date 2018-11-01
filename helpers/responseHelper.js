'use strict';

module.exports.successResponse = function (res, data, success) {
  res.json({
    success: success === undefined ? true : success,
    data: data
  });
};

module.exports.errorResponse = function (res, error) {
  res.json({
    success: false,
    data: {
      // If no custom code was set then use the standard HTTP error code
      code   : error.statusCode,
      message: error.message
    }
  });
};
