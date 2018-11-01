'use strict';

angular.module('iapAdmin').controller('LogEntryViewCtrl', function ($scope, $location, $routeParams, logEntryService, uiGmapGoogleMapApi) {

  $scope.back = function() {
    $location.path('/logEntries');
  };

  $scope.mapsOptions = {
    zoom: 14,
    options: {
      scrollwheel: false
    }
  };

  $scope.markerOptions = {
    icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
  };

  $scope.customerMarkerOptions = {
    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
  };

  $scope.lineOptions = {
    color: '#6060FB',
    weight: 3
  };

  $scope.lineMarkerOptions = {
    icon: ' ',
    labelContent: '',
    labelClass: 'marker-label'
  };

  $scope.logEntryId = $routeParams.id;
  $scope.logEntry = null;

  $scope.lineMarkerId = '00000';
  $scope.lineMarkerCoords;

  uiGmapGoogleMapApi.then(function(maps) {

    var getInfoWindowCallback = function(iwInstance, label) {
      return function(marker, eventName, scope, eventArgs) {
        if (iwInstance) {
          iwInstance.close();
        } else {
          iwInstance = new maps.InfoWindow({
            content: label
          });
        }

        iwInstance.open(marker.getMap(), marker);
      }
    };

    $scope.lineEvents = {
      click: function(polyline, eventName, scope, eventArgs) {
        var latLng = eventArgs[0].latLng;
        $scope.lineMarkerCoords = {
          latitude : latLng.lat(),
          longitude: latLng.lng()
        };
      }
    };

    var iwMachine, iwCustomer;

    $scope.markerEvents = {
      click: getInfoWindowCallback(iwMachine, 'Machine Location')
    };

    $scope.customerMarkerEvents = {
      click: getInfoWindowCallback(iwCustomer, 'End Customer')
    };

    $scope.$watch('lineMarkerCoords', function() {
      if (! ($scope.logEntry && $scope.logEntry.customerLocation)) {
        return;
      }

      var latLngMachine  = new maps.LatLng($scope.logEntry.location.latitude, $scope.logEntry.location.longitude),
          latLngCustomer = new maps.LatLng($scope.logEntry.customerLocation.latitude, $scope.logEntry.customerLocation.longitude);

      var distance = maps.geometry.spherical.computeDistanceBetween(latLngMachine, latLngCustomer);

      var distInKms = distance * 0.001,
          distInMi  = distance * 0.000621371;


      $scope.lineMarkerOptions.labelContent = distInMi.toFixed(3) + ' mi / ' + distInKms.toFixed(3) + ' kms';
    });

  });

  $scope.init = function() {
    // Fetch entry from API
    logEntryService.get($scope.logEntryId)
      .then(function (response) {
        $scope.logEntry = response.data.logEntry;
        $scope.customerInfo = response.data.customerInfo;

        $scope.linePath = [ $scope.logEntry.location, $scope.logEntry.customerLocation ];
        // This causes the distance label to appear on load
//        $scope.lineMarkerCoords = $scope.logEntry.customerLocation;

        $scope.mapsOptions.center = _.clone($scope.logEntry.location);
      }, function (response) {
        // This should never happen
        $scope.error = response.data.message;
        console.log("Error: ", response);
      });
  };

  $scope.init();

});
