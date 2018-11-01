'use strict';

var actionsLogService = require('../services/actionsLogService');

module.exports.getLogEntries = function (req, res, next) {
  // Set flag for standard responses handling
  req.standardRes = true;

  actionsLogService.searchLogEntries(req.query, function (err, logEntries, count) {
    if (err) {
      return next(err);
    }

    res.json({
      count: count,
      logEntries: logEntries
    });
  });
};

module.exports.getLogEntry = function (req, res, next) {
  // Set flag for standard responses handling
  req.standardRes = true;

  actionsLogService.getLogEntry(req.params.id, function (err, logEntry, customerInfo) {
    if (err) {
      return next(err);
    }

    res.json({
      logEntry: logEntry,
      customerInfo: customerInfo
    });
  });
};
