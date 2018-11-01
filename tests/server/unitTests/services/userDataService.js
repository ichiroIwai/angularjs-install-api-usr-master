'use strict';

var should = require('should'),
  sinon = require('sinon'),
  ldap = require('ldapjs'),
  Sequelize = require('sequelize'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  fs = require('fs'),
  nock = require('nock');

var dataService = require('../../../../services/userDataService'),
    config = require('../../../../config'),
    models = require('../../../../models'),
    Token = models.Token,
    User = models.User;

var ZhsUserGetDetailResponseError = fs.readFileSync(__dirname + '/../fixtures/ZhsUserGetDetailResponseError.xml'),
  ZhsUserGetDetailResponseOk = fs.readFileSync(__dirname + '/../fixtures/ZhsUserGetDetailResponseOk.xml'),
  ZhsUserGetDetailResponseFail = fs.readFileSync(__dirname + '/../fixtures/ZhsUserGetDetailResponseFail.xml');

module.exports = function() {

  describe('getUserData', function() {

    var sinonSandbox, userFindOneStub, userUpsertStub;

    before(function() {
      sinonSandbox = sinon.sandbox.create();
      userFindOneStub = sinonSandbox.stub(User, 'findOne');
      userUpsertStub = sinonSandbox.stub(User, 'upsert');
    });

    afterEach(function() {
      userFindOneStub.reset();
      userUpsertStub.reset();
    });

    describe('Failure tests', function() {
      it('should fail if the user query fails', function(done) {
        userFindOneStub.returns(Sequelize.Promise.reject(new Error('Failed!')));

        dataService.getUserData('johndoe', 'johndoe', function(err, user) {
          err.should.exist;
          done();
        });
      });

      it('should fail when the WS returns the user does not exist', function(done) {
        // Mock the DB response as null so the service gets the user from SAP
        userFindOneStub.returns(Sequelize.Promise.resolve(null));

        // Mock the WS response
        var wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_bapi_user_get_detail/300/zhs_bapi_user_get_detail/zhs_bapi_user_get_detail')
          .reply(201, ZhsUserGetDetailResponseError, {
            'Content-Type': 'application/xml'
          });

        dataService.getUserData('johndoe', 'johndoe', function(err, user) {
          err.should.exist;
          err.message.should.equal('User has no Technician Certification ID');

          // Assert that the mock was invoked
          wsMock.done();
          done();
        });
      });

      it('should fail when the WS is down', function(done) {
        // Mock the DB response as null so the service gets the user from SAP
        userFindOneStub.returns(Sequelize.Promise.resolve(null));

        // Mock the WS response
        var wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_bapi_user_get_detail/300/zhs_bapi_user_get_detail/zhs_bapi_user_get_detail')
          .reply(500, ZhsUserGetDetailResponseFail, {
            'Content-Type': 'application/xml'
          });

        dataService.getUserData('johndoe', 'johndoe', function(err, user) {
          err.should.exist;
          err.message.should.equal('Request to WS failed with error: Error: undefined: undefined');
          // Assert that the mock was invoked
          wsMock.done();
          done();
        });
      });
    });

    describe('Success tests', function() {
      it('should query sap if the user data in the database is expired', function(done) {
        // Mock the WS response
        var wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_bapi_user_get_detail/300/zhs_bapi_user_get_detail/zhs_bapi_user_get_detail')
          .reply(201, ZhsUserGetDetailResponseOk, {
            'Content-Type': 'application/xml'
          });

        // Mock the DB response
        var expiredUser = {
          sapUsername : 'JDOE',
          firstName   : 'John',
          lastName    : 'Doe',
          techCertId  : '12345678',
          lastUpdate  : new Date(new Date().getTime() - 86400 * 365 * 1000) // 1 year in the past
        };
        var mockUser = {
          sapUsername : 'JDOE',
          firstName   : 'John',
          lastName    : 'Doe',
          techCertId  : '12345678',
          lastUpdate  : new Date() // 1 year in the past
        };
        userFindOneStub.onFirstCall().returns(Sequelize.Promise.resolve(expiredUser));
        userFindOneStub.returns(Sequelize.Promise.resolve(mockUser));
        userUpsertStub.returns(Sequelize.Promise.resolve({}));

        dataService.getUserData('johndoe', 'johndoe', function(err, user) {
          should.not.exist(err);
          user.sapUsername.should.equal('JDOE');
          user.firstName.should.equal('John');
          user.lastName.should.equal('Doe');
          user.techCertId.should.equal('12345678');
          // Assert that the webservice mock was invoked
          wsMock.done();
          done();
        });
      });

      it('should return the user when found in the database', function(done) {
        // Mock the DB response
        var mockUser = {
          sapUsername : 'JDOE',
          firstName   : 'John',
          lastName    : 'Doe',
          techCertId  : '12345678',
          lastUpdate  : new Date()
        };
        userFindOneStub.onFirstCall().returns(Sequelize.Promise.resolve(mockUser));

        dataService.getUserData('johndoe', 'johndoe', function(err, user) {
          should.not.exist(err);
          user.sapUsername.should.equal(mockUser.sapUsername);
          user.firstName.should.equal(mockUser.firstName);
          user.lastName.should.equal(mockUser.lastName);
          user.techCertId.should.equal(mockUser.techCertId);
          done();
        });
      });

      it('should query sap and create a user even if the SAP technician ID does not exist when a default is set', function(done) {
        // Mock the WS response
        var wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_bapi_user_get_detail/300/zhs_bapi_user_get_detail/zhs_bapi_user_get_detail')
          .reply(201, ZhsUserGetDetailResponseError, {
            'Content-Type': 'application/xml'
          });

        var mockUser = {
          sapUsername : 'JDOE',
          firstName   : 'John',
          lastName    : 'Doe',
          techCertId  : '54321',
          lastUpdate  : new Date()
        };

        userFindOneStub.onFirstCall().returns(Sequelize.Promise.resolve(null));
        userFindOneStub.onSecondCall().returns(Sequelize.Promise.resolve(mockUser));
        userUpsertStub.returns(Sequelize.Promise.resolve({}));

        config.sap.defaultServiceTechId = '54321';

        dataService.getUserData('johndoe', 'johndoe', function(err, user) {
          should.not.exist(err);
          user.sapUsername.should.equal('JDOE');
          user.firstName.should.equal('John');
          user.lastName.should.equal('Doe');
          user.techCertId.should.equal('54321');
          // Assert that the webservice mock was invoked
          wsMock.done();

          // Revert changes on config file
          delete config.sap.defaultServiceTechId;

          done();
        });
      });

    });

    after(function () {
      sinonSandbox.restore();
    });

  });
};