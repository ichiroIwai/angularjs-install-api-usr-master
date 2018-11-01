'use strict';

angular.module('iapAdmin', [
  'ngResource',
  'ngStorage',
  'ngRoute',
  'http-auth-interceptor',
  'ui.bootstrap',
  'ngTable',
  'uiGmapgoogle-maps'
])
  .config(function ($routeProvider, $locationProvider, $httpProvider, uiGmapGoogleMapApiProvider) {
    $httpProvider.interceptors.push('authInterceptor');

    $routeProvider
      .when('/', {
        templateUrl: 'modules/admin/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/login', {
        templateUrl: 'modules/admin/views/login.html',
        controller: 'LoginCtrl'
      })
      .when('/logEntries/:id/view', {
        templateUrl : 'modules/logEntries/views/logEntryView.html',
        controller  : 'LogEntryViewCtrl',
        requiresAuth: true
      })
      .when('/logEntries', {
        templateUrl : 'modules/logEntries/views/logEntriesIndex.html',
        controller  : 'LogEntryIndexCtrl',
        requiresAuth: true
      })
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(false);

    uiGmapGoogleMapApiProvider.configure({
      key      : 'AIzaSyDmF-bETwoVq3WIzOa7w1bcXOYdnMXAnxc',
      libraries: 'geometry'
    });
  })

  .run(function ($route, $rootScope, $location, authService, storageService, flashService) {

    $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
      var nextPath = $location.path();
      var nextRoute = $route.routes[nextPath];

      // autoredirect to login if trying to access main page, but with no error message
      if (nextRoute && nextRoute.controller == 'MainCtrl' && !authService.isAuthorized()) {
        $location.path('/login');
      }

      // Check if the user has a token
      if (nextRoute && nextRoute.requiresAuth && ! authService.isAuthorized()) {
        flashService.set('You must login first', 'danger');
        $location.path('/login');
      }
    });

    // Redirect to login in the event of requests with 401 responses
    // This will only be used when the token expires on the server
    $rootScope.$on('event:auth-loginRequired', function() {
      flashService.set('You must login first', 'danger');
      $location.path('/login');
    });

    // Redirect to index and display a forbidden message
    // in the event of requests with 403 responses
    $rootScope.$on('event:auth-forbidden', function() {
      flashService.set('You are not authorized to access this page', 'danger');
      $location.path('/');
    });

    // Check if the user is authenticated
    $rootScope.isAuthorized = function () {
      return authService.isAuthorized();
    };

    $rootScope.getCurrentUser = function () {
      return storageService.getValue('admin');
    };

  });
