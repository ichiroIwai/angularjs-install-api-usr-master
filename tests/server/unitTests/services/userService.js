'use strict';

var should        = require('should'),
    sinon         = require('sinon'),
    nock          = require('nock'),
    fs            = require('fs');

var userService = require('../../../../services/userService'),
    authService = require('../../../../services/ldapAuthService'),
    dataService = require('../../../../services/userDataService');

var validParams = {
  user: 'user',
  pass: 'pass'
};

var ZhsGetSapidFromAdloginOk = fs.readFileSync(__dirname + '/../fixtures/ZhsGetSapidFromAdloginOk.xml');

module.exports = function () {

  describe('login', function () {

    var sinonSandbox, loginUserStub, getUserDataStub;

    before(function () {
      sinonSandbox = sinon.sandbox.create();
      loginUserStub = sinonSandbox.stub(authService, 'loginUser');
      getUserDataStub = sinonSandbox.stub(dataService, 'getUserData');
    });

    afterEach(function () {
      loginUserStub.reset();
      getUserDataStub.reset();
    });

    it('should fail when auth service returned an error', function (done) {
      loginUserStub.callsArgWith(1, new Error('Error with login'));

      userService.login({}, false, function (err) {
        err.should.exist;
        err.message.should.equal('Error with login');

        loginUserStub.calledOnce.should.be.true;
        getUserDataStub.called.should.be.false;

        done();
      });
    });

    it('should fail when user data service returned an error', function (done) {
      var wsMock = nock('https://qasecc.haascnc.com')
        .post('/sap/bc/srt/rfc/sap/zhs_get_sapid_from_adlogin/300/zhs_get_sapid_from_adlogin/zhs_get_sapid_from_adlogin')
        .reply(201, ZhsGetSapidFromAdloginOk, {
          'Content-Type': 'application/xml'
        });
      loginUserStub.callsArgWith(1, null, 'dummyToken');
      getUserDataStub.callsArgWith(2, new Error('Error with user data'));

      userService.login({}, false, function (err) {
        err.should.exist;
        err.message.should.equal('Error with user data');

        loginUserStub.calledOnce.should.be.true;
        getUserDataStub.called.should.be.true;
        wsMock.done();
        done();
      });
    });

    it('should fail when an admin login is requested and the user is not admin', function (done) {
      var wsMock = nock('https://qasecc.haascnc.com')
        .post('/sap/bc/srt/rfc/sap/zhs_get_sapid_from_adlogin/300/zhs_get_sapid_from_adlogin/zhs_get_sapid_from_adlogin')
        .reply(201, ZhsGetSapidFromAdloginOk, {
          'Content-Type': 'application/xml'
        });
      loginUserStub.callsArgWith(1, null, 'dummyToken');
      getUserDataStub.callsArgWith(2, null, { isAdmin: false });

      userService.login({}, true, function (err) {
        err.should.exist;
        err.message.should.equal('User is not allowed to access admin resources');

        loginUserStub.calledOnce.should.be.true;
        getUserDataStub.called.should.be.true;
        wsMock.done();
        done();
      });
    });

    it('should return login data for a regular user', function (done) {
      var wsMock = nock('https://qasecc.haascnc.com')
        .post('/sap/bc/srt/rfc/sap/zhs_get_sapid_from_adlogin/300/zhs_get_sapid_from_adlogin/zhs_get_sapid_from_adlogin')
        .reply(201, ZhsGetSapidFromAdloginOk, {
          'Content-Type': 'application/xml'
        });
      loginUserStub.callsArgWith(1, null, 'dummyToken');
      getUserDataStub.callsArgWith(2, null, { sapUsername: 'sapName', isAdmin: false });

      userService.login({}, false, function (err, result) {
        should.not.exist(err);

        result.should.eql({
          token: 'dummyToken',
          userData: { sapUsername: 'sapName', isAdmin: false }
        });

        loginUserStub.calledOnce.should.be.true;
        getUserDataStub.called.should.be.true;
        wsMock.done();
        done();
      });
    });

    it('should return login data for an admin user', function (done) {
      var wsMock = nock('https://qasecc.haascnc.com')
        .post('/sap/bc/srt/rfc/sap/zhs_get_sapid_from_adlogin/300/zhs_get_sapid_from_adlogin/zhs_get_sapid_from_adlogin')
        .reply(201, ZhsGetSapidFromAdloginOk, {
          'Content-Type': 'application/xml'
        });
      loginUserStub.callsArgWith(1, null, 'dummyToken');
      getUserDataStub.callsArgWith(2, null, { sapUsername: 'sapName', isAdmin: true });

      userService.login({}, true, function (err, result) {
        should.not.exist(err);

        result.should.eql({
          token: 'dummyToken',
          userData: { sapUsername: 'sapName', isAdmin: true }
        });

        loginUserStub.calledOnce.should.be.true;
        getUserDataStub.called.should.be.true;
        wsMock.done();
        done();
      });
    });

    after(function () {
      sinonSandbox.restore();
    });

  });

};
