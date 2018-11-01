'use strict';

angular.module('iapAdmin').controller('LogEntryIndexCtrl', function ($scope, $location, logEntryService, ngTableParams, uiGmapGoogleMapApi) {

  $scope.view = function(logEntry) {
    $location.path('/logEntries/' + logEntry.id + '/view');
  };

  $scope.mapsOptions = {
    zoom: 14,
    options: {
      scrollwheel: false
    }
  };

  $scope.init = function() {
    $scope.filters = {
      search: ''
    };

    $scope.tableParams = new ngTableParams({
      page: 1,
      count: 10,
      sorting: {
        timestamp: 'desc'
      },
      filter: $scope.filters
    }, {
      total: 0,
      getData: function($defer, params) {
        $scope.loading = true;
        logEntryService.index(params.url())
          .then(function (response) {
            params.total(response.data.count);
            $defer.resolve(response.data.logEntries);
            $scope.loading = false;
          }, function (response) {
            // This should never happen
            $scope.error = response.data.message;
            console.log("Error: ", response);
          });
      }
    });
  };

  $scope.init();

});
