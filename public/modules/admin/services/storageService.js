'use strict';

angular.module('iapAdmin').service('storageService', function ($window) {

  this.saveValue = function(key, value) {
    $window.localStorage.setItem(key, JSON.stringify(value));
  };

  this.getValue = function(key) {
    return JSON.parse($window.localStorage.getItem(key));
  };

  this.removeValue = function(key) {
    $window.localStorage.removeItem(key);
  };

});
