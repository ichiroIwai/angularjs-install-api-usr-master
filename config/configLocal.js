'use strict';

var config = {};

config.database = {
  host    : '127.0.0.1',
  db      : 'mobapi_haascnc_com',
  user    : 'root',
  port    : 3306,
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

module.exports = config;
