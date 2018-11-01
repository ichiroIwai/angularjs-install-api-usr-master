'use strict';

var config = {};

config.api = {
  port: 3000
};

config.sap = {
  timeout : 1 * 1000 // 1 second
};

config.logger = {
  consoleLevel: 'none'
};

module.exports = config;
