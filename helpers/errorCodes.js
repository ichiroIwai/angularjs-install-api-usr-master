'use strict';

var codeMappings = {
  serialNumber      : 'invalid_serial',
  lat               : 'lat',
  lon               : 'lon',
  latitude          : 'latitude',
  longitude         : 'longitude',
  notificationNumber: 'notificationNumber',
  correctiveAction  : 'correctiveAction',
  machineCode       : 'invalid_machine_code',
  macAddress        : 'invalid_mac_address',
  softwareVersion   : 'invalid_software_version',
  user              : 'user',
  pass              : 'pass'
};

// Gets an error from joi and extracts the expected error code
module.exports.getErrorCode = function (error) {
  var errorCode = error.details && error.details[0] && error.details[0].path;
  return codeMappings[errorCode];
};
