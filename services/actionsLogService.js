'use strict';

var _      = require('lodash'),
    moment = require('moment');

var models      = require('../models'),
    logger      = require('../config/logger'),
    config      = require('../config'),
    LogEntry    = models.LogEntry,
    User        = models.User,
    errors      = require('../lib/errors'),
    errorCodes  = require('../helpers/errorCodes'),
    queryHelper = require('../lib/queryHelper'),
    sapService  = require('./sapService');

var searchAttributes = [ 'action', '$User.sapUsername$' ];

module.exports.logActionError = function(action, params, user, callback) {
  logAction(action, params, user, 'error', callback);
};

module.exports.logActionSuccess = function(action, params, user, callback) {
  logAction(action, params, user, 'success', callback);
};

module.exports.searchLogEntries = function (params, callback) {
  var queryParams = queryHelper.buildPaginationParams(params);

  queryParams.where = {};
  queryParams.include = [{
    model   : User,
    required: true
  }];

  var searchStr = params.filter && params.filter.search;

  // Check if we need to filter by a search string
  if (searchStr) {
    queryParams.where.$or = [];

    _.each(searchAttributes, function (attribute) {
      var condition = {};
      condition[attribute] = { $like: '%' + searchStr + '%' };
      queryParams.where.$or.push(condition);
    });
  }

  LogEntry
    .findAndCountAll(queryParams).then(function (result) {
      callback(null, result.rows, result.count);
    })
    .catch(function(error) {
      callback(new errors.InternalServerError('Error while querying for log entries'));
    });
};

module.exports.getLogEntry = function (logEntryId, callback) {
  LogEntry
    .findById(logEntryId, {
      include: [{
        model   : User,
        required: true
      }]
    })
    .then(function (logEntry) {
      if (! logEntry) {
        return callback(new errors.NotFoundError('Could not found log entry'));
      }

      sapService.callCheckSerialNumberWS(logEntry.serialNumber, function (error, customerInfo) {
        if (error) {
          logger.warn('Error while fetching data for serial number: ' + logEntry.serialNumber);
        }
        callback(null, logEntry, customerInfo || {});
      });
    })
    .catch(function(error) {
      callback(new errors.InternalServerError('Error while querying for log entry'));
    });
};

var logAction = function(action, params, user, type, callback) {
  // convert something like "/iap/do-something" to "do-something"
  action = action.substr(action.lastIndexOf('/') + 1);
  if (! _.includes(config.actionsLog.actions, action)) {
    return callback(new errors.BadRequestError('Invalid action type'));
  };

  var logEntry = LogEntry.build({
    timestamp: new Date(),
    action   : action,
    data     : params || {},
    type     : type
  });

  // TODO: We should be able to something like the following, but I can't get to
  // configure the association, I think the "user" object not being an actual model
  // might be the cause of the issue
//  logEntry.setUser(user);
  logEntry.userId = user.id;

  logEntry.save()
    .then(function (newLogEntry) {
      callback();
    })
    .catch(function () {
      callback(new errors.InternalServerError('Error while saving new log entry'));
    })
};
