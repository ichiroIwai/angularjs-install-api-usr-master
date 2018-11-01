'use strict';

var should    = require('should'),
    sinon     = require('sinon'),
    Sequelize = require('sequelize');

var actionsLogService = require('../../../../services/actionsLogService'),
    config            = require('../../../../config'),
    models            = require('../../../../models'),
    LogEntry          = models.LogEntry,
    User              = models.User;

module.exports = function() {

  describe('logAction', function() {

    var sinonSandbox, userSaveStub, clock, currentDate;

    before(function() {
      currentDate = new Date();
      clock = sinon.useFakeTimers(currentDate.getTime(), 'Date');

      sinonSandbox = sinon.sandbox.create();
      userSaveStub = sinonSandbox.stub(Sequelize.Instance.prototype, 'save');
    });

    afterEach(function() {
      userSaveStub.reset();
    });

    describe('Failure tests', function() {

      it('should fail if action is invalid', function (done) {

        actionsLogService.logActionSuccess('dummy-action', {}, {}, function (err) {
          err.should.exist;
          err.message.should.equal('Invalid action type');

          userSaveStub.called.should.be.false;

          done();
        });
      });

      it('should fail if saving the log entry failed', function (done) {

        userSaveStub.returns(Sequelize.Promise.reject(new Error('Failed!')));

        actionsLogService.logActionSuccess('/iap/validate-location', {}, { id: 123 }, function (err) {
          err.should.exist;
          err.message.should.equal('Error while saving new log entry');

          userSaveStub.calledOnce.should.be.true;

          done();
        });
      });

    });

    describe('Success tests', function() {
      it('should save log action to the database', function(done) {

        userSaveStub.returns(Sequelize.Promise.resolve({}));

        var params = {
          key1: 'value1',
          key2: 'value2'
        };

        actionsLogService.logActionSuccess('/iap/validate-location', params, { id: 123 }, function (err) {
          should.not.exist(err);

          userSaveStub.calledOnce.should.be.true;
          userSaveStub.thisValues[0].dataValues.should.eql({
            id: null,
            timestamp: currentDate,
            action: 'validate-location',
            data: '{"key1":"value1","key2":"value2"}',
            userId: 123,
            type: 'success'
          });

          done();
        });
      });

    });

    after(function () {
      sinonSandbox.restore();
      clock.restore();
    });

  });

  describe('searchLogEntries', function() {

    var sinonSandbox, logEntrySearchStub;

    before(function() {
      sinonSandbox = sinon.sandbox.create();
      logEntrySearchStub = sinonSandbox.stub(LogEntry, 'findAndCountAll');
    });

    afterEach(function() {
      logEntrySearchStub.reset();
    });

    describe('Failure tests', function() {

      it('should fail if fetching log entries from database failed', function (done) {

        logEntrySearchStub.returns(Sequelize.Promise.reject(new Error('Failed!')));

        actionsLogService.searchLogEntries({}, function (err) {
          err.should.exist;
          err.message.should.equal('Error while querying for log entries');

          logEntrySearchStub.calledOnce.should.be.true;

          done();
        });
      });

    });

    describe('Success tests', function() {

      var queryResult = {
        rows: [ { id: 123 }, { id: 321 } ],
        count: 5
      };

      it('should send a query with default pagination params to fetch log entries', function(done) {

        logEntrySearchStub.returns(Sequelize.Promise.resolve(queryResult));

        actionsLogService.searchLogEntries({}, function (err, rows, count) {
          should.not.exist(err);

          rows.should.eql(queryResult.rows);
          count.should.equal(5);

          logEntrySearchStub.calledOnce.should.be.true;
          logEntrySearchStub.args[0][0].should.eql({
            limit: 10,
            offset: 0,
            order: [],
            where: {},
            include: [ { model: User, required: true } ]
          });

          done();
        });
      });

      it('should send a query with specific pagination params to fetch log entries', function(done) {

        logEntrySearchStub.returns(Sequelize.Promise.resolve(queryResult));

        actionsLogService.searchLogEntries({
          count: 15,
          page: 2,
          sorting: {
            'User.sapUsername': 'desc'
          }
        }, function (err, rows, count) {
          should.not.exist(err);

          rows.should.eql(queryResult.rows);
          count.should.equal(5);

          logEntrySearchStub.calledOnce.should.be.true;
          logEntrySearchStub.args[0][0].should.eql({
            limit: 15,
            offset: 15,
            order: [ [ User, 'sapUsername', 'desc' ] ],
            where: {},
            include: [ { model: User, required: true } ]
          });

          done();
        });
      });

      it('should send a query with a search string to fetch log entries', function(done) {

        logEntrySearchStub.returns(Sequelize.Promise.resolve(queryResult));

        actionsLogService.searchLogEntries({
          count: 10,
          page: 1,
          sorting: {
            'timestamp': 'asc'
          },
          filter: {
            search: 'string'
          }
        }, function (err, rows, count) {
          should.not.exist(err);

          rows.should.eql(queryResult.rows);
          count.should.equal(5);

          logEntrySearchStub.calledOnce.should.be.true;
          logEntrySearchStub.args[0][0].should.eql({
            limit: 10,
            offset: 0,
            order: [ [ 'timestamp', 'asc' ] ],
            where: {
              '$or': [
                { action: { '$like': '%string%' } },
                { '$User.sapUsername$': { '$like': '%string%' } }
              ]
            },
            include: [ { model: User, required: true } ]
          });

          done();
        });
      });

    });

    after(function () {
      sinonSandbox.restore();
    });

  });

  describe('getLogEntry', function() {

    var sinonSandbox, logEntryFindByIdStub;

    before(function() {
      sinonSandbox = sinon.sandbox.create();
      logEntryFindByIdStub = sinonSandbox.stub(LogEntry, 'findById');
    });

    afterEach(function() {
      logEntryFindByIdStub.reset();
    });

    describe('Failure tests', function() {

      it('should fail if fetching the log entry from database failed', function (done) {

        logEntryFindByIdStub.returns(Sequelize.Promise.reject(new Error('Failed!')));

        actionsLogService.getLogEntry(12345, function (err) {
          err.should.exist;
          err.message.should.equal('Error while querying for log entry');

          logEntryFindByIdStub.calledOnce.should.be.true;

          done();
        });
      });

      it('should fail if no log entry was found', function (done) {

        logEntryFindByIdStub.returns(Sequelize.Promise.resolve(null));

        actionsLogService.getLogEntry(12345, function (err) {
          err.should.exist;
          err.message.should.equal('Could not found log entry');

          logEntryFindByIdStub.calledOnce.should.be.true;
          logEntryFindByIdStub.args[0][0].should.equal(12345);

          done();
        });
      });

    });

    describe('Success tests', function() {

      it('should use the model to search for a log entry', function (done) {

        logEntryFindByIdStub.returns(Sequelize.Promise.resolve({
          id: 321,
          action: 'dummyAction'
        }));

        actionsLogService.getLogEntry(321, function (err, result) {
          should.not.exist(err);

          result.should.eql({
            id: 321,
            action: 'dummyAction'
          })

          logEntryFindByIdStub.calledOnce.should.be.true;
          logEntryFindByIdStub.args[0][0].should.equal(321);

          done();
        });
      });

    });

    after(function () {
      sinonSandbox.restore();
    });

  });

};
