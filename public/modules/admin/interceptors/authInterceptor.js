'use strict';

angular.module('iapAdmin').factory('authInterceptor', ['$q', '$injector', function ($q, $injector) {

  return {
    request: function (config) {
      var authService = $injector.get('authService');
      var token = authService.getToken();

      if (token) {
        config.headers['http_token'] = token;
      }

      return config;
    },

    response: function (res) {
      var token = res.data.token;
      var authService = $injector.get('authService');

      if (token) {
        authService.saveToken(token);
      }

      return res;
    }
  };

}]);
