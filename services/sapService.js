'use strict';

var soap = require('soap'),
    _    = require('lodash'),
    fs   = require('fs');

var config = require('../config'),
    errors = require('../lib/errors');

var soapClients = {};

var soapAuth = new soap.BasicAuthSecurity(config.sap.username, config.sap.password, {
  rejectUnauthorized: config.sap.rejectUnauthorized,
  strictSSL         : config.sap.strictSSL
});

var soap12Options = {
  'forceSoap12Headers': true
};

var soapNon12Options = {
  'forceSoap12Headers': false
};

_.each(config.sap.wsdl, function (wsdlFile, name) {
  // Special case for the myhaascnc.com wsdl's
  var soapOptions = name === 'wsCheckSerialNumber' ? soapNon12Options : soap12Options;

  soap.createClient(wsdlFile, soapOptions, function (err, client) {
    if (err) {
      // If the wsdl file could not be found or the client failed
      // then we don't want to continue
      throw err;
    }

    client.setSecurity(soapAuth);
    soapClients[name] = client;
  });
});

module.exports.callUpdateLocationWS = function (params, imagePath, callback) {

  //// Update Location
  //var wsdlFile = '/wsdl/zhs_validation_custadr_webserv-ver2-QA.wsdl';
  //var args = {
  //    'IsInput' : {
  //        'Serno'         : '1991091917',
  //        'BinaryStream'  : 'cid:1215347743456',
  //        'Longitude'     : -64.2155039,
  //        'Latitude'      : -31.4245372,
  //        'ConfirmCheck'  : 'X',
  //        'ServiceTechid' : '11474'
  //    }
  //};
  //var functionName = 'ZhsValidationCustadrWebserv';

  var wsArgs = {
    IsInput: {
      Serno        : params.serialNumber,
      Longitude    : params.location.longitude,
      Latitude     : params.location.latitude,
      ServiceTechid: params.serviceTechId,
      ConfirmCheck : params.confirmCheck ? 'X' : ' '
    }
  };

  readImageFile(imagePath, function (err, data) {
    if (err) {
      return callback(err);
    }

    wsArgs.IsInput.BinaryStream = data.toString('base64');

    soapClients.wsUpdateLocation.ZhsValidationCustadrWebserv(wsArgs, function (err, result, raw) {
      // Remove Binary Stream before building log info
      delete wsArgs.IsInput.BinaryStream;
      var logInfo = buildLogInfo(params, wsArgs, result, imagePath);

      if (err) {
        // The error message is not really meaningful
        return callback(new errors.InternalServerError('Request to WS failed with error: ' + err), logInfo);
      }

      if (_.isString(result.ENotificationNo) && result.ENotificationNo.length > 0) {
        callback(null, logInfo, result.ENotificationNo);
      } else if (result.EtReturn && result.EtReturn.item && result.EtReturn.item[0]) {
        callback(new errors.BadRequestError(result.EtReturn.item[0].Message), logInfo);
      } else {
        callback(new errors.BadRequestError('SAP service returned empty response.'), logInfo);
      }
    }, { timeout: config.sap.timeout });
  });
};

module.exports.callValidateLocationWS = function (params, callback) {

  //// Location validation
  //var wsdlFile = '/wsdl/zhs_validation_data_webserv-ver2-QA.wsdl';
  //var args = {
  //    'IsInput' : {
  //        'Serno'         : '1991091917',
  //        'Longitude'     : -64.2155039,
  //        'Latitude'      : -31.4245372,
  //        'ServiceTechid' : '10420'
  //    }
  //};
  //var functionName = 'ZhsValidationDataWebserv';

  var wsArgs = {
    IsInput: {
      Serno         : params.serialNumber,
      Longitude     : params.location.longitude,
      Latitude      : params.location.latitude,
      ServiceTechid : params.serviceTechId
    }
  };

  soapClients.wsValidateLocation.ZhsValidationDataWebserv(wsArgs, function (err, result, raw) {
    var logInfo = buildLogInfo(params, wsArgs, result);

    if (err) {
      // The error message is not really meaningful
      return callback(new errors.InternalServerError('Request to WS failed with error: ' + err), logInfo);
    }

    if (result.EStatus === 'Pass') {
      callback(null, logInfo, result.ENotificationNo, true);
    } else if (result.EStatus === 'Fail') {
      callback(null, logInfo, result.ENotificationNo, false);
    } else if (result.EtReturn && result.EtReturn.item && result.EtReturn.item[0]) {
      callback(new errors.BadRequestError(result.EtReturn.item[0].Message), logInfo);
    } else {
      callback(new errors.BadRequestError('SAP service returned empty response.'), logInfo);
    }
  }, { timeout: config.sap.timeout });
};

module.exports.callCorrectiveActionWS = function (params, callback) {

  //// Corrective Action
  //var wsdlFile = '/wsdl/zhs_validation_wfcact_webserv-QA.wsdl';
  //var args = {
  //    'ICorrActionText'   : 'This is a test. Please disregard.',
  //    'INotificationNo'   : '000302883409'
  //};
  //var functionName = 'ZhsValidationWfcactWebserv';

  var wsArgs = {
    ICorrActionText    : params.correctiveAction,
    INotificationNo    : params.notificationNumber
  };

  soapClients.wsCorrectiveAction.ZhsValidationWfcactWebserv(wsArgs, function (err, result, raw) {
    var logInfo = buildLogInfo(params, wsArgs, result);

    if (err) {
      // The error message is not really meaningful
      return callback(new errors.InternalServerError('Request to WS failed with error: ' + err), logInfo);
    }

    if (result.EWfInitiateSuccess === 'Pass') {
      var responseSuccess = {
        'message' : 'Corrective action submitted.',
        'code'    : '200'
      };
      callback(null, logInfo, responseSuccess);
    } else if (result.EtReturn && result.EtReturn.item && result.EtReturn.item[0]) {
      callback(new errors.BadRequestError(result.EtReturn.item[0].Message), logInfo);
    } else {
      callback(new errors.BadRequestError('SAP service returned empty response.'), logInfo);
    }
  }, { timeout: config.sap.timeout });
};

module.exports.callMachineDetailsWS = function (params, imagePath, callback) {

  //// Machine Details
  //var wsdlFile = '/wsdl/zhs_install_equip_update_data-QA-Version3.wsdl';
  //var args = {
  //    'IsInput' : {
  //        'Serno'         : '1991091917',
  //        'BinaryStream'  : 'cid:1215347743456',
  //        'Longitude'     : -64.2155039,
  //        'Latitude'      : -31.4245372,
  //        'Username'      : 'vhadad',
  //        'Timestamp'     : 1448310582
  //    }
  //};
  //var functionName = 'ZhsInstallEquipUpdWebserv';

  var wsArgs = {
    IsInput: {
      Serno        : params.serialNumber,
      Longitude    : params.lon,
      Latitude     : params.lat,
      Username     : params.username,
      Timestamp    : params.timestamp,
      FailedPhoto  : params.failedPhoto ? 'X' : ' '
    }
  };

  readImageFile(imagePath, function (err, data) {
    if (err) {
      return callback(err);
    }

    wsArgs.IsInput.BinaryStream = data.toString('base64');

    soapClients.wsMachineDetails.ZhsInstallEquipUpdWebserv(wsArgs, function (err, result, raw) {
      // Remove Binary Stream before building log info
      delete wsArgs.IsInput.BinaryStream;
      var logInfo = buildLogInfo(params, wsArgs, result, imagePath);

      if (err) {
        // The error message is not really meaningful
        return callback(new errors.InternalServerError('Request to WS failed with error: ' + err), logInfo);
      }

      if (result.EStatus === 'Successfully attached the Image to the Equipment') {
        callback(null, logInfo, {
          locationAllowed: result.EsOutput.FailedEndcust !== 'X',
          machine: {
            serialNumber   : _.trimLeft(result.EsOutput.Sernr, ' 0'),
            name           : result.EsOutput.Matnr,
            macAddress     : result.EsOutput.ZzmacAddress,
            softwareVersion: result.EsOutput.Zzsoftwarever
          },
          location: {
            lat: result.EsOutput.LatitudeEndcust,
            lon: result.EsOutput.LongitudeEndcust
          }
        });
      } else {
        callback(new errors.BadRequestError('Image could not be attached to Equipment'), logInfo);
      }
    }, { timeout: config.sap.timeout });
  });

};

module.exports.callActivationCodeWS = function (params, callback) {

  //// Activation Code
  //var wsdlFile = '/wsdl/zhs_install_notif_cr_webserv-QA.wsdl';
  //var args = {
  //    'IMacAddress'    : '00:1E:BF:00:5E:CE',
  //    'IMachGenCode'   : '576976',
  //    'ISerno'         : '1991091917',
  //    'IServiceTechid' : '11474',
  //    'ISoftwarever'   : 'M18.08C',
  //    'ITimestamp'     : 1448310656,
  //    'IUsername'      : 'vhadad'
  //};
  //var functionName = 'ZhsInstallNotifCrWebserv';

  var wsArgs = {
    IMacAddress    : params.macAddress,
    IMachGenCode   : params.machineCode,
    ISerno         : params.serialNumber,
    IServiceTechid : params.serviceTechId,
    ISoftwarever   : params.softwareVersion,
    ITimestamp     : params.timeStamp,
    IUsername      : params.userName
  };

  soapClients.wsActivationCode.ZhsInstallNotifCrWebserv(wsArgs, function (err, result, raw) {
    var logInfo = buildLogInfo(params, wsArgs, result);

    if (err) {
      // The error message is not really meaningful
      return callback(new errors.InternalServerError('Request to WS failed with error: ' + err), logInfo);
    }

    if (result && result.EExtensionTime) {
      var resultSuccess = {
        activationCode      : result.EResultCode,
        extensionTime       : result.EExtensionTime,
        notificationNumber  : result.ENotificationNo
      };
      callback(null, logInfo, resultSuccess);
    } else if (result.EtReturn && result.EtReturn.item && result.EtReturn.item[0]) {
      callback(new errors.BadRequestError(result.EtReturn.item[0].Message), logInfo);
    } else {
      callback(new errors.BadRequestError('SAP service returned empty response.'), logInfo);
    }

  }, { timeout: config.sap.timeout });
};

module.exports.callADToSAPLoginWS = function(adLogin, callback) {
  var wsArgs = {
    IAdloginid: adLogin
  };

  var client = soapClients.wsGetSapLogin;
  client.ZhsGetSapidFromAdlogin(wsArgs, function (err, result, raw) {
    if (err) {
      // The error message is not really meaningful
      return callback(new errors.InternalServerError('Request to WS failed with error: ' + err));
    }

    if (result.ESaploginid && typeof result.ESaploginid === 'string') {
      callback(null, result.ESaploginid);
    } else {
      callback(new errors.InternalServerError('SAP User not found'));
    }
  }, { timeout: config.sap.timeout });
};

module.exports.callUserGetDetailWS = function (username, callback) {
  var wsArgs = {
      USERNAME: username,
      RETURN: ""
  };
  var client = soapClients.wsUserGetDetail;
  var zhsUserGetDetail = client.ZHS_BAPI_USER_GET_DETAIL.ZHS_BAPI_USER_GET_DETAIL.ZHS_BAPI_USER_GET_DETAIL;
  zhsUserGetDetail(wsArgs, function (err, result, raw) {
    if (err) {
      // The error message is not really meaningful
      return callback(new errors.InternalServerError('Request to WS failed with error: ' + err));
    }
    var dataFromSap = {
      sapUsername: result.USER_NAME,
      firstName:   result.CONTACT_DETAILS.NAMEV,
      lastName:    result.CONTACT_DETAILS.NAME1,
      techCertId:  result.SERV_TECH_CERT_ID
    };
    for (var k in dataFromSap) {
      // quick and dirty check, as the soapClient might return
      // empty objects (i.e: {}) when data is not available
      if (typeof dataFromSap[k] == 'object') {
        dataFromSap[k] = '';
      }
    }
    callback(null, dataFromSap);
  }, { timeout: config.sap.timeout });
};

module.exports.callCheckSerialNumberWS = function (serialNumber, callback) {

  //// Check Serial Number
  //var wsdlFile = '/wsdl/zhmtc_check_serial_number-QA.wsdl';
  //var args = {
  //    'HAAS_ACCOUNT_NUMB': '',
  //    'SERIAL_NUMB'      : '576976',
  //    'USER_ID'          : '',
  //    'USER_LANGUAGE'    : '',
  //};
  //var functionName = 'ZHMTC_CHECK_SERIAL_NUMBER';

  if (! serialNumber) {
    return callback(null, {});
  }

  var wsArgs = {
    HAAS_ACCOUNT_NUMB: '',
    SERIAL_NUMB      : serialNumber,
    USER_ID          : '',
    USER_LANGUAGE    : ''
  };

  soapClients.wsCheckSerialNumber.ZHMTC_CHECK_SERIAL_NUMBER(wsArgs, function (err, result, raw) {
    if (err) {
      // The error message is not really meaningful
      return callback(new errors.InternalServerError('Request to WS failed with error: ' + err));
    }

    var resultStatus = result.ET_RETURN.item[0];

    if (resultStatus.TYPE === 'S') {
      callback(null, result.EXP_ADDRESS);
    } else if (resultStatus.TYPE === 'E') {
      callback(new errors.BadRequestError(resultStatus.MESSAGE));
    } else {
      callback(new errors.BadRequestError('Unexpected error on external service', result));
    }
  }, { timeout: config.sap.timeout });
};

var readImageFile = function (imagePath, callback) {
  fs.readFile(imagePath, function (err, jpeg) {
    if (err) {
      return callback(err);
    }

    callback(null, jpeg);
  });
};

var buildLogInfo = function (params, wsArgs, response, imagePath) {
  var logInfo = {
    params  : params,
    wsArgs  : wsArgs,
    response: response
  };

  if (imagePath) {
    logInfo.image = imagePath;
  }

  return logInfo;
};
