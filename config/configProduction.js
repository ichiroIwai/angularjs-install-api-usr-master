'use strict';

var config = {};

config.database = {
  db      : 'mobapi_haascnc_com',
  user    : 'mobapi_user',
  pass    : 'smcX8f6NmQuhbuaz',
  host    : 'linux-mysql.haasauto.local'
};

config.sap = {
  wsdl: {
    wsUserGetDetail    : __dirname + '/wsdl/zhs_bapi_user_get_detail-PRD.wsdl',
    wsUpdateLocation   : __dirname + '/wsdl/zhs_validation_custadr_webserv-PRD.wsdl',
    wsValidateLocation : __dirname + '/wsdl/zhs_validation_data_webserv-PRD.wsdl',
    wsCorrectiveAction : __dirname + '/wsdl/zhs_validation_wfcact_webserv-PRD.wsdl',
    wsMachineDetails   : __dirname + '/wsdl/zhs_install_equip_update_data-1204-PRD.wsdl',
    wsActivationCode   : __dirname + '/wsdl/zhs_install_notif_cr_webserv-PRD.wsdl',
    wsGetSapLogin      : __dirname + '/wsdl/zhs_get_sapid_from_adlogin-PRD.wsdl'
  },
  username: 'RFC_INSAPP',
  password: 'sKxK)jWvnSkE{V>Jps2D&\\b<-@gAg=9xHU+sGpsy'
};

config.api = {
  port: 3000
};

config.newrelic = {
  licenseKey: 'e7dde12c9ce4962943f21eb23de84662d1cb331b',
  appNames: [ 'mobapi.haascnc.com', 'PROD applications' ],
  labels: 'server:linux-prod;vcenter:PHXVCenter'
};

module.exports = config;
