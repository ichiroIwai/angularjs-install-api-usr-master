'use strict';

var config = {};

config.database = {
  db      : 'mobapi_haascnc_com',
  user    : 'root',
  pass    : ''
};

config.api = {
  port: 3000
};

config.sap = {
  defaultServiceTechId: '10420',
  defaultFirstName: 'John',
  defaultLastName: 'Doe'
};

config.newrelic = {
  licenseKey: 'e7dde12c9ce4962943f21eb23de84662d1cb331b',
  appNames: [ 'mobapi.haasauto.dev', 'DEV applications' ],
  labels: 'server:linux-dev;vcenter:HAIVCenter'
};

module.exports = config;
