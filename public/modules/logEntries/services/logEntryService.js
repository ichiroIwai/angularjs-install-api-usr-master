'use strict';

angular.module('iapAdmin').service('logEntryService', function ($http) {

  this.index = function (params) {
    return $http.get('/admin/logEntries', { params: params });
  };

  this.get = function (logEntryId) {
    return $http.get('/admin/logEntries/' + logEntryId);
  };

  this.currentEntry = null;

  this.setCurrentEntry = function (logEntry) {
    this.currentEntry = logEntry;
  }

  this.getCurrentEntry = function () {
    return this.currentEntry;
  }

});
