'use strict';

angular.module('iapAdmin').controller('NavbarCtrl', function ($scope, $location, authService) {

  $scope.logout = function(form) {
    authService.logout();

    $location.path('/');
  };

});
