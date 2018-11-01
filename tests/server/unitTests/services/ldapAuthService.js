'use strict';

var should        = require('should'),
    sinon         = require('sinon'),
    ldap          = require('ldapjs'),
    Sequelize     = require('sequelize'),
    // TODO: This should be the proper way to stub ldap client
//    ldapClientLib = require('ldapjs/lib/client/client'),
    ldapClientLib = require('../../ldapClient'),
    util          = require('util'),
    EventEmitter  = require('events').EventEmitter;

var authService = require('../../../../services/ldapAuthService'),
    config = require('../../../../config'),
    models = require('../../../../models'),
    Token  = models.Token;

var validParams = {
  user: 'user',
  pass: 'pass'
};

module.exports = function () {

  describe('loginUser', function () {

    var sinonSandbox, ldapClientBindStub, ldapClientSearchStub, tokenCreateStub;

    before(function () {
      sinonSandbox = sinon.sandbox.create();
      ldapClientBindStub = sinonSandbox.stub(ldapClientLib.prototype, 'bind');
      ldapClientSearchStub = sinonSandbox.stub(ldapClientLib.prototype, 'search');
      tokenCreateStub = sinonSandbox.stub(Token, 'create');
    });

    afterEach(function () {
      ldapClientBindStub.reset();
      ldapClientSearchStub.reset();
      tokenCreateStub.reset();
    });

    it('should fail when the params are invalid', function (done) {
      authService.loginUser({}, function (err) {
        err.should.exist;
        err.message.should.equal('Username or password invalid');

        done();
      });
    });

    it('should fail when the binding on LDAP with admin credentials fails', function (done) {
      // Invokes the callback at index 2 with an error
      ldapClientBindStub.callsArgWith(2, 'Error with admin login');

      authService.loginUser(validParams, function (err) {
        err.should.exist;
        err.message.should.equal('Authentication service unavailable');

        done();
      });
    });

    it('should fail when the search on LDAP with admin credentials fails', function (done) {
      // Invokes the callback at index 2 with no error
      ldapClientBindStub.callsArgWith(2, null);
      // Invokes the callback at index 2 with an error
      ldapClientSearchStub.callsArgWith(2, 'Error with ldap search');

      authService.loginUser(validParams, function (err) {
        err.should.exist;
        err.message.should.equal('Authentication service unavailable');

        done();
      });
    });

    it('should fail when the search on LDAP with admin credentials returns an error', function (done) {
      // Invokes the callback at index 2 with no error
      ldapClientBindStub.callsArgWith(2, null);

      config.ldap.servers.forEach(function (server, index) {
        var searchRes = new EventEmitter();

        // Invokes the callback at index 2 with an event emitter
        ldapClientSearchStub.onCall(index).callsArgWith(2, null, searchRes);

        // Wait a little while before emitting the event
        // TODO: Check if there's a better way of doing this
        setTimeout(function () {
          searchRes.emit('error', 'Error on search');
        }, 100);

      });

      authService.loginUser(validParams, function (err) {
        err.should.exist;
        err.message.should.equal('Authentication service unavailable');

        done();
      });
    });

    it('should fail when the search on LDAP with admin credentials returned no entries', function (done) {
      // Invokes the callback at index 2 with no error
      ldapClientBindStub.callsArgWith(2, null);

      config.ldap.servers.forEach(function (server, index) {
        var searchRes = new EventEmitter();

        // Invokes the callback at index 2 with an event emitter
        ldapClientSearchStub.onCall(index).callsArgWith(2, null, searchRes);

        // Wait a little while before emitting the event
        // TODO: Check if there's a better way of doing this
        setTimeout(function () {
          searchRes.emit('end');
        }, 100);

      });

      authService.loginUser(validParams, function (err) {
        err.should.exist;
        err.message.should.equal('Username or password invalid');

        done();
      });
    });

    it('should fail when the search on LDAP returned an entry but the password is invalid', function (done) {
      config.ldap.servers.forEach(function (server, index) {
        var searchRes = new EventEmitter();

        // Admin login succeeds
        ldapClientBindStub.onCall(index * 2).callsArgWith(2, null);

        // Invokes the callback at index 2 with an event emitter
        ldapClientSearchStub.onCall(index).callsArgWith(2, null, searchRes);

        // Yield an error on the second call to bind
        ldapClientBindStub.onCall(index * 2 + 1).callsArgWith(2, 'Auth error with user credentials');

        // Wait a little while before emitting the event
        // TODO: Check if there's a better way of doing this
        setTimeout(function () {
          searchRes.emit('searchEntry', {
            object: {
              dn       : 'dn',
              givenName: 'givenName',
              sn       : 'sn'
            }
          });
        }, 100);

      });

      authService.loginUser(validParams, function (err) {
        err.should.exist;
        err.message.should.equal('Username or password invalid');

        done();
      });
    });

    it('should return a token if the credentials are valid', function (done) {
      // Stub the creation of a new token in the db
      tokenCreateStub.returns(Sequelize.Promise.resolve({}));

      config.ldap.servers.forEach(function (server, index) {
        var searchRes = new EventEmitter();

        // Admin login succeeds
        ldapClientBindStub.onCall(index * 2).callsArgWith(2, null);

        // Invokes the callback at index 2 with an event emitter
        ldapClientSearchStub.onCall(index).callsArgWith(2, null, searchRes);

        // Yield an error on the second call to bind
        ldapClientBindStub.onCall(index * 2 + 1).callsArgWith(2, null);

        // Wait a little while before emitting the event
        // TODO: Check if there's a better way of doing this
        setTimeout(function () {
          searchRes.emit('searchEntry', {
            object: {
              dn       : 'dn',
              givenName: 'givenName',
              sn       : 'sn'
            }
          });
        }, 100);

      });

      authService.loginUser(validParams, function (err, authData) {
        should.not.exist(err);

        authData.token.should.exist;
        authData.fullName.should.equal('givenName sn');

        done();
      });
    });

    after(function () {
      sinonSandbox.restore();
    });

  });

  describe('validateToken', function () {

    var sinonSandbox, tokenFindOneStub;

    before(function () {
      sinonSandbox = sinon.sandbox.create();
      tokenFindOneStub = sinonSandbox.stub(Token, 'findOne');
    });

    afterEach(function () {
      tokenFindOneStub.reset();
    });

    it('should fail if the token query fails', function (done) {
      tokenFindOneStub.returns(Sequelize.Promise.reject(new Error('Failed!')));

      authService.validateToken('token', function (err) {
        err.should.exist;
        err.message.should.equal('Error while querying for token');

        done();
      });
    });

    it('should fail if the token query does not return a token', function (done) {
      tokenFindOneStub.returns(Sequelize.Promise.resolve(null));

      authService.validateToken('token', function (err) {
        err.should.exist;
        err.message.should.equal('Invalid or expired token');

        done();
      });
    });

    it('should fail if the token query returns an expired token', function (done) {
      var now = new Date();
      var token = {
        expiration: now.setSeconds(now.getSeconds() - 10)
      }
      tokenFindOneStub.returns(Sequelize.Promise.resolve(token));

      authService.validateToken('token', function (err) {
        err.should.exist;
        err.message.should.equal('Invalid or expired token');

        done();
      });
    });

    it('should succeed if the token query returns an active token', function (done) {
      var now = new Date();
      var token = {
        expiration: now.setSeconds(now.getSeconds() + 10),
        username: 'username'
      }
      tokenFindOneStub.returns(Sequelize.Promise.resolve(token));

      authService.validateToken('token', function (err, returnedToken) {
        should.not.exist(err);
        returnedToken.username.should.equal(token.username);

        done();
      });
    });

    after(function () {
      sinonSandbox.restore();
    });

  });

};
