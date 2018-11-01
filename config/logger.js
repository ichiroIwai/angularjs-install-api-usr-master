'use strict';

var winston = require('winston');

var config = require('./index');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ colorize: true, level: config.logger.consoleLevel, timestamp: true }),
    new (winston.transports.File)({ filename: config.logger.logFile })
  ]
});

module.exports = logger;
