'use strict';

var should = require('should'),
    fs     = require('fs'),
    nock   = require('nock');

var sapService = require('../../../../services/sapService');

var ZhsValidationCustadrWebservResponseOk    = fs.readFileSync(__dirname + '/../fixtures/ZhsValidationCustadrWebservResponseOk.xml'),
    ZhsValidationCustadrWebservResponseError = fs.readFileSync(__dirname + '/../fixtures/ZhsValidationCustadrWebservResponseError.xml'),
    ZhsValidationCustadrWebservResponseFail  = fs.readFileSync(__dirname + '/../fixtures/ZhsValidationCustadrWebservResponseFail.xml'),
    ZhsValidationDataWebservResponseOk       = fs.readFileSync(__dirname + '/../fixtures/ZhsValidationDataWebservResponseOk.xml'),
    ZhsValidationDataWebservResponseError    = fs.readFileSync(__dirname + '/../fixtures/ZhsValidationDataWebservResponseError.xml'),
    ZhsValidationDataWebservResponseFail     = fs.readFileSync(__dirname + '/../fixtures/ZhsValidationDataWebservResponseFail.xml'),
    ZhsInstallEquipUpdWebservResponseOk       = fs.readFileSync(__dirname + '/../fixtures/ZhsInstallEquipUpdWebservResponseOk.xml'),
    ZhsInstallEquipUpdWebservResponseError    = fs.readFileSync(__dirname + '/../fixtures/ZhsInstallEquipUpdWebservResponseError.xml'),
    ZhsInstallEquipUpdWebservResponseFail     = fs.readFileSync(__dirname + '/../fixtures/ZhsInstallEquipUpdWebservResponseFail.xml');

var validImagePath = __dirname + '/../fixtures/uploadImage.jpg';

module.exports = function () {

  describe('callUpdateLocationWS', function () {

    var params = {
      location: {}
    };

    var wsMock;

    describe('Failure tests', function () {

      it('should fail when the response from the WS contains an error', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_custadr_webserv/300/zhs_validation_custadr_webserv/zhs_validation_custadr_webserv')
          .reply(201, ZhsValidationCustadrWebservResponseError, {
            'Content-Type': 'application/xml'
          });

        sapService.callUpdateLocationWS(params, validImagePath, function (err) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('Please make sure to check the Confirmation checkbox after reading Note.');

          done();
        });

      });

      it('should fail when the WS returns a 500 status code', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_custadr_webserv/300/zhs_validation_custadr_webserv/zhs_validation_custadr_webserv')
          .reply(500, ZhsValidationCustadrWebservResponseFail, {
            'Content-Type': 'application/xml'
          });

        sapService.callUpdateLocationWS(params, validImagePath, function (err) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('Request to WS failed with error: Error: undefined: undefined');

          done();
        });

      });

      it('should fail when the WS call fails', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_custadr_webserv/300/zhs_validation_custadr_webserv/zhs_validation_custadr_webserv')
          .replyWithError();

        sapService.callUpdateLocationWS(params, validImagePath, function (err) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('Request to WS failed with error: Error: Cannot parse response');

          done();
        });

      });

      it('should fail when the WS does not respond after the configured timeout', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_custadr_webserv/300/zhs_validation_custadr_webserv/zhs_validation_custadr_webserv')
          .delayConnection(2000)
          .reply(201, ZhsValidationCustadrWebservResponseOk, {
            'Content-Type': 'application/xml'
          });

        sapService.callUpdateLocationWS(params, validImagePath, function (err) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('Request to WS failed with error: Error: ETIMEDOUT');

          done();
        });

      });

    });

    describe('Success tests', function () {

      it('should return the notification number if the WS returned a success response', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_custadr_webserv/300/zhs_validation_custadr_webserv/zhs_validation_custadr_webserv')
          .reply(201, ZhsValidationCustadrWebservResponseOk, {
            'Content-Type': 'application/xml'
          });

        sapService.callUpdateLocationWS(params, validImagePath, function (err, fullResponse, notificationNumber) {
          // Assert that the mock was invoked
          wsMock.done();

          should.not.exist(err);
          notificationNumber.should.equal('000302883408');

          fullResponse.should.eql({
            image: '/home/lucas/umami/install-api/tests/server/unitTests/services/../fixtures/uploadImage.jpg',
            params: { location: {} },
            response: { ENotificationNo: '000302883408', EtReturn: {} },
            wsArgs: {
              IsInput: {
                ConfirmCheck: ' ',
                Latitude: undefined,
                Longitude: undefined,
                Serno: undefined,
                ServiceTechid: undefined
              }
            }
          });

          done();
        });

      });

    });

    after(function () {
      nock.cleanAll();
    });

  });

  describe('callValidateLocationWS', function () {

    var params = {
      location: {}
    };

    var wsMock;

    describe('Failure tests', function () {

      it('should fail when the response from the WS contains an error', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_data_webserv/300/zhs_validation_data_webserv/zhs_validation_data_webserv')
          .reply(201, ZhsValidationDataWebservResponseError, {
            'Content-Type': 'application/xml'
          });

        sapService.callValidateLocationWS(params, function (err) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('No Equipment entries found for the Serial number entered.');

          done();
        });

      });

      it('should fail when the WS returns a 500 status code', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_data_webserv/300/zhs_validation_data_webserv/zhs_validation_data_webserv')
          .reply(201, ZhsValidationDataWebservResponseFail, {
            'Content-Type': 'application/xml'
          });

        sapService.callValidateLocationWS(params, function (err) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('Request to WS failed with error: Error: undefined: undefined');

          done();
        });

      });

      it('should fail when the WS call fails', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_data_webserv/300/zhs_validation_data_webserv/zhs_validation_data_webserv')
          .replyWithError();

        sapService.callValidateLocationWS(params, function (err) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('Request to WS failed with error: Error: Cannot parse response');

          done();
        });

      });

      it('should fail when the WS does not respond after the configured timeout', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_data_webserv/300/zhs_validation_data_webserv/zhs_validation_data_webserv')
          .delayConnection(2000)
          .reply(201, ZhsValidationDataWebservResponseOk, {
            'Content-Type': 'application/xml'
          });

        sapService.callValidateLocationWS(params, function (err) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('Request to WS failed with error: Error: ETIMEDOUT');

          done();
        });

      });

    });

    describe('Success tests', function () {

      it('should return the notification number if the WS returned a success response', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_data_webserv/300/zhs_validation_data_webserv/zhs_validation_data_webserv')
          .reply(201, ZhsValidationDataWebservResponseOk, {
            'Content-Type': 'application/xml'
          });

        sapService.callValidateLocationWS(params, function (err, fullResponse, notificationNumber, result) {
          // Assert that the mock was invoked
          wsMock.done();

          should.not.exist(err);
          notificationNumber.should.equal('000302883394');

          result.should.be.true;

          fullResponse.should.eql({
            params: { location: {} },
            response: {
              ENotificationNo: '000302883394',
              EStatus: 'Pass',
              EtReturn: {}
            },
            wsArgs: {
              IsInput: {
                Latitude: undefined,
                Longitude: undefined,
                Serno: undefined,
                ServiceTechid: undefined
              }
            }
          });

          done();
        });

      });

    });

    after(function () {
      nock.cleanAll();
    });

  });

  describe('callMachineDetailsWS', function () {

    var params = {};

    var wsMock;

    describe('Failure tests', function () {

      it('should fail when the response from the WS contains an error', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_install_equip_update_data/300/zhs_install_equip_update_data/zhs_install_equip_update_data')
          .reply(201, ZhsInstallEquipUpdWebservResponseError, {
            'Content-Type': 'application/xml'
          });

        sapService.callMachineDetailsWS(params, validImagePath, function (err, machineDetails) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('Image could not be attached to Equipment');

          done();
        });

      });

      it('should fail when the WS returns a 500 status code', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_install_equip_update_data/300/zhs_install_equip_update_data/zhs_install_equip_update_data')
          .reply(500, ZhsInstallEquipUpdWebservResponseFail, {
            'Content-Type': 'application/xml'
          });

        sapService.callMachineDetailsWS(params, validImagePath, function (err, machineDetails) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('Request to WS failed with error: Error: undefined: undefined');

          done();
        });

      });

      it('should fail when the WS call fails', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_install_equip_update_data/300/zhs_install_equip_update_data/zhs_install_equip_update_data')
          .replyWithError();

        sapService.callMachineDetailsWS(params, validImagePath, function (err, machineDetails) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('Request to WS failed with error: Error: Cannot parse response');

          done();
        });

      });

      it('should fail when the WS does not respond after the configured timeout', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_install_equip_update_data/300/zhs_install_equip_update_data/zhs_install_equip_update_data')
          .delayConnection(2000)
          .reply(201, ZhsInstallEquipUpdWebservResponseOk, {
            'Content-Type': 'application/xml'
          });

        sapService.callMachineDetailsWS(params, validImagePath, function (err) {
          // Assert that the mock was invoked
          wsMock.done();

          err.should.exist;
          err.message.should.equal('Request to WS failed with error: Error: ETIMEDOUT');

          done();
        });

      });

    });

    describe('Success tests', function () {

      it('should return the notification number if the WS returned a success response', function (done) {

        // Mock the WS response
        wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_install_equip_update_data/300/zhs_install_equip_update_data/zhs_install_equip_update_data')
          .reply(201, ZhsInstallEquipUpdWebservResponseOk, {
            'Content-Type': 'application/xml'
          });

        sapService.callMachineDetailsWS(params, validImagePath, function (err, fullResponse, machineDetails) {
          // Assert that the mock was invoked
          wsMock.done();

          should.not.exist(err);
          machineDetails.should.eql({
            location: {
              lat: '0.0',
              lon: '0.0'
            },
            locationAllowed: true,
            machine: {
              macAddress: '00:1E:BF:00:5E:CE',
              name: 'VF-8/50',
              serialNumber: '1991091917',
              softwareVersion: 'M18.08C'
            }
          });

          fullResponse.should.eql({
            image: '/home/lucas/umami/install-api/tests/server/unitTests/services/../fixtures/uploadImage.jpg',
            params: {},
            response: {
              EStatus: 'Successfully attached the Image to the Equipment',
              EsOutput: {
                FailedEndcust: {},
                LatitudeEndcust: '0.0',
                LongitudeEndcust: '0.0',
                Matnr: 'VF-8/50',
                Sernr: '000000001991091917',
                ZzmacAddress: '00:1E:BF:00:5E:CE',
                Zzsoftwarever: 'M18.08C'
              },
              EtReturn: {}
            },
            wsArgs: {
              IsInput: {
                FailedPhoto: ' ',
                Latitude: undefined,
                Longitude: undefined,
                Serno: undefined,
                Timestamp: undefined,
                Username: undefined
              }
            }
          });

          done();
        });

      });

    });

    after(function () {
      nock.cleanAll();
    });

  });

};
