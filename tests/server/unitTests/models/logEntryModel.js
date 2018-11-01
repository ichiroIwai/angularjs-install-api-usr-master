'use strict';

var should    = require('should'),
    sinon     = require('sinon'),
    Sequelize = require('sequelize');

var models   = require('../../../../models'),
    LogEntry = models.LogEntry;

module.exports = function() {

  var data = {
    key1: 'value1',
    key2: 'value2'
  };

  describe('Data custom set/get', function() {

    it('should store a JSON string representation for the data attribute', function () {

      var logEntry = LogEntry.build({
        data: data
      });

      logEntry.data.should.eql(data);
      logEntry.dataValues.data.should.equal(JSON.stringify(data));
    });

    it('should return a default empty object for the data attribute if missing', function () {

      var logEntry = LogEntry.build({});

      logEntry.data.should.eql({});
      should.not.exist(logEntry.dataValues.data);
    });

  });

  describe('"params" virtual attribute', function() {

    it('should return the "params" part of the data value', function () {

      var logEntry = LogEntry.build({
        data: {
          wsArgs: data
        }
      });

      logEntry.params.should.eql(data);
    });

    it('should return an empty "params" object if data is missing', function () {

      var logEntry = LogEntry.build({});

      logEntry.params.should.eql({});
    });

  });

  describe('"location" virtual attribute', function() {

    it('should get coordinates for the machine details action', function () {

      var logEntry = LogEntry.build({
        action: 'machine-details',
        data: {
          params: {
            lat: 12.3,
            lon: 45.6
          }
        }
      });

      logEntry.location.should.eql({
        latitude: 12.3,
        longitude: 45.6
      });
    });

    it('should get coordinates for the validate location action', function () {

      var logEntry = LogEntry.build({
        action: 'validate-location',
        data: {
          params: {
            location: {
              latitude: 12.3,
              longitude: 45.6
            }
          }
        }
      });

      logEntry.location.should.eql({
        latitude: 12.3,
        longitude: 45.6
      });
    });

    it('should get coordinates for the update location action', function () {

      var logEntry = LogEntry.build({
        action: 'update-location',
        data: {
          params: {
            location: {
              latitude: 12.3,
              longitude: 45.6
            }
          }
        }
      });

      logEntry.location.should.eql({
        latitude: 12.3,
        longitude: 45.6
      });
    });

    it('should get undefined coordinates for other actions', function () {

      var logEntry = LogEntry.build({
        action: 'corrective-action',
        data: {
          params: data
        }
      });

      should.not.exist(logEntry.location);
    });

  });

  describe('"image" virtual attribute', function() {

    it('should return the "image" part of the data value', function () {

      var logEntry = LogEntry.build({
        data: {
          image: 'imagePath'
        }
      });

      logEntry.image.should.eql('imagePath');
    });

    it('should return an undefined "image" if data is missing', function () {

      var logEntry = LogEntry.build({});

      should.not.exist(logEntry.image);
    });

  });

};
