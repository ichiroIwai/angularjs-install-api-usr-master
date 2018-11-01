'use strict';

var should = require('should'),
    sinon  = require('sinon'),
    piexif = require("piexifjs"),
    fs     = require('fs'),
    nock   = require('nock');

var validationService = require('../../../../services/validationService');

var validImagePath     = __dirname + '/../fixtures/uploadImage.jpg',
    validImageCopyPath = __dirname + '/../fixtures/uploadImageCopy.jpg',
    invalidImagePath   = __dirname + '/../fixtures/notSupported.png';

var ZhsValidationCustadrWebservResponseOk    = fs.readFileSync(__dirname + '/../fixtures/ZhsValidationCustadrWebservResponseOk.xml'),
    ZhsValidationCustadrWebservResponseError = fs.readFileSync(__dirname + '/../fixtures/ZhsValidationCustadrWebservResponseError.xml');

var validImage = {
  path: validImageCopyPath
};

var unsupportedImage = {
  path: invalidImagePath
};

var validPayload = JSON.stringify({
  location: {
    latitude: -32.6,
    longitude: 120.45
  },
  serialNumber: '123456',
  confirmCheck: true
});

module.exports = function () {

  describe('sendUpdateLocation', function () {

    describe('Failure tests', function () {

      it('should fail when no image is provided', function (done) {

        validationService.sendUpdateLocation(undefined, '', {}, function (err) {
          err.should.exist;
          err.message.should.equal('No image was uploaded');

          done();
        });

      });

      it('should fail when the image format is not supported', function (done) {

        validationService.sendUpdateLocation(unsupportedImage, '', {}, function (err) {
          err.should.exist;
          err.message.should.equal('Invalid mime type for image');

          done();
        });

      });

      it('should fail when the json payload is invalid', function (done) {

        validationService.sendUpdateLocation(validImage, 'invalid', {}, function (err) {
          err.should.exist;
          err.message.should.equal('Error parsing payload');

          done();
        });

      });

      it('should fail when one of the fields in the payload is invalid', function (done) {

        var invalidPayload = JSON.stringify({
          location: {
            latitude: -92.6,
            longitude: 120.45
          },
          serialNumber: '123456',
          confirmCheck: true
        });

        validationService.sendUpdateLocation(validImage, invalidPayload, {}, function (err) {
          err.should.exist;
          err.message.should.equal('The structure of the payload is invalid');

          done();
        });

      });

      it('should fail when the WS returned an error response', function (done) {

        // Mock the WS response
        var wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_custadr_webserv/300/zhs_validation_custadr_webserv/zhs_validation_custadr_webserv')
          .reply(201, ZhsValidationCustadrWebservResponseError, {
            'Content-Type': 'application/xml'
          });

        validationService.sendUpdateLocation(validImage, validPayload, {}, function (err, notificationNumber) {
          err.should.exist;
          err.message.should.equal('Please make sure to check the Confirmation checkbox after reading Note.');

          // Assert that the mock was invoked
          wsMock.done();

          done();
        });

      });

    });

    describe('Success tests', function () {

      before(function (done) {
        fs.readFile(validImagePath, function (err, data) {
          if (err) {
            return done(err);
          }

          fs.writeFile(validImageCopyPath, data, done);
        });
      });

      it('should complete sending machine details when the json payload and the image are valid', function (done) {

        // Mock the WS response
        var wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_validation_custadr_webserv/300/zhs_validation_custadr_webserv/zhs_validation_custadr_webserv')
          .reply(201, ZhsValidationCustadrWebservResponseOk, {
            'Content-Type': 'application/xml'
          });

        var user = {
          techCertId: '112233'
        };

        validationService.sendUpdateLocation(validImage, validPayload, user, function (err, info, notificationNumber) {
          should.not.exist(err);

          // Assert that the mock was invoked
          wsMock.done();

          notificationNumber.should.equal('000302883408');

          info.should.eql({
            image: validImageCopyPath,
            params: {
              confirmCheck: true,
              location: { latitude: -32.6, longitude: 120.45 },
              serialNumber: '123456',
              serviceTechId: '112233'
            },
            response: { ENotificationNo: '000302883408', EtReturn: {} },
            wsArgs: {
              IsInput: {
                ConfirmCheck: 'X',
                Latitude: -32.6,
                Longitude: 120.45,
                Serno: '123456',
                ServiceTechid: '112233'
              }
            }
          });

          fs.readFile(validImageCopyPath, function (err, jpeg) {
            if (err) {
              return done(err);
            }

            var jpegData = jpeg.toString("binary");
            var exifObj = piexif.load(jpegData);

            exifObj.Exif.should.exist;
            exifObj.GPS.should.exist;
            // Date field
            exifObj['0th']['306'].should.exist;

            done();
          });

        });

      });

      after(function () {
        // Cleanup pending mocks
        nock.cleanAll();
      });

    });

  });

};
