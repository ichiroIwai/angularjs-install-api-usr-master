'use strict';

var path = require('path'),
    _ = require('lodash');

var env = process.env.NODE_ENV || 'development';

var envConfig = require('./' + _.camelCase('config-' + env));

var config = {
  environment: env
};

config.database = {
  host    : 'localhost',
  dialect : 'mysql'
};

config.api = {
  port: 3000
};

config.token = {
  headerName: 'http_token',
  length: 16,
  validTime: 86400 * 7 // one week
};

config.userData = {
  validTime: 86400 * 7 // one week between requesting user data updates from SAP
}

config.logger = {
  logFile: path.join(__dirname, '../logs/all.log'),
  consoleLevel: 'info'
};

config.imageUploads = {
  maxSize: 10 * 1024 * 1024,
  supportedFormats: [ 'image/jpeg' ],
  // Path is relative to app root
  path: 'uploads'
};

config.sap = {
  wsdl              : {
    wsUserGetDetail    : __dirname + '/wsdl/zhs_user_get_detail-QA.wsdl',
    wsUpdateLocation   : __dirname + '/wsdl/zhs_validation_custadr_webserv-ver2-QA.wsdl',
    wsValidateLocation : __dirname + '/wsdl/zhs_validation_data_webserv-ver2-QA.wsdl',
    wsCorrectiveAction : __dirname + '/wsdl/zhs_validation_wfcact_webserv-QA.wsdl',
    wsMachineDetails   : __dirname + '/wsdl/zhs_install_equip_update_data-1202-ver1-QA.wsdl',
    wsActivationCode   : __dirname + '/wsdl/zhs_install_notif_cr_webserv-QA.wsdl',
    wsGetSapLogin      : __dirname + '/wsdl/zhs_get_sapid_from_adlogin-QA.wsdl',
    wsCheckSerialNumber: __dirname + '/wsdl/zhmtc_check_serial_number-QA.wsdl'
  },
  username          : 'RFC_INSAPP',
  password          : 'HEpz]deoRm6&b~o]\\XUD]Pb)EpxDKon{MLxbdP~@',
  timeout           : 10 * 1000, // 10 seconds
  strictSSL         : false,
  rejectUnauthorized: false
};

config.actionsLog = {
  actions: [
    'machine-details',
    'get-activation-code',
    'validate-location',
    'update-location',
    'corrective-action'
  ]
};

config.ldap = {
  servers : [
    {
      url        : 'ldap://10.3.1.24',
      user       : 'CN=drupal ldap,CN=Users,DC=haasportal,DC=com',
      pass       : 'Ph0n3boOX!',
      searchBase : 'dc=haasportal,dc=com',
      filterName : 'cn'
    },
    {
      url        : 'ldap://10.1.1.11',
      user       : 'CN=drupal ldap,OU=Users,OU=Special Accounts,OU=Departments,OU=HAASHAI,DC=haasauto,DC=local',
      pass       : 'Ph0n3boOX!',
      searchBase : 'dc=haasauto,dc=local',
      filterName : 'mailNickname'
    }
  ],
  timeouts: {
    connect: 5 * 1000, // 5 seconds
    operations: 5 * 1000 // 5 seconds
  }
};

module.exports = _.defaultsDeep(envConfig, config);
