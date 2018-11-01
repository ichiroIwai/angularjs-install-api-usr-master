'use strict';

angular.module('iapAdmin').controller('LoginCtrl', function ($scope, $location, authService, storageService) {

  $scope.errorMessage = '';
  $scope.hasError = false;

  $scope.login = function(form) {
    authService.login($scope.user)
      .then(function (response) {
        storageService.saveValue('admin', response.data.admin);
        // Just to to landing page, token should
        // be already saved by interceptor
        $location.path('/');
      }, function (response) {
        $scope.hasError = true;
        $scope.errorMessage = 'Login error: ' + response.data.message;
      });
  };

});
