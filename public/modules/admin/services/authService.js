'use strict';

angular.module('iapAdmin').service('authService', function ($http, $window, storageService) {

  this.login = function (postData) {
    return $http.post('/admin/login', postData, {
      // We don't need the auth interceptor here
      ignoreAuthModule: true
    });
  };

  this.logout = function () {
    storageService.removeValue('token');
  };

  this.isAuthorized = function() {
    return storageService.getValue('token');
  };

  this.saveToken = function(token) {
    storageService.saveValue('token', token);
  };

  this.getToken = function() {
    return storageService.getValue('token');
  };

  this.removeToken = function() {
    storageService.removeValue('token');
  };

});
