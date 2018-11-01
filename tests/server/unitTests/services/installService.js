'use strict';

var should = require('should'),
    sinon  = require('sinon'),
    piexif = require("piexifjs"),
    fs     = require('fs'),
    nock   = require('nock');

var installService = require('../../../../services/installService');

var validImagePath     = __dirname + '/../fixtures/uploadImage.jpg',
    validImageCopyPath = __dirname + '/../fixtures/uploadImageCopy.jpg',
    invalidImagePath   = __dirname + '/../fixtures/notSupported.png';

var ZhsInstallEquipUpdWebservResponseOk    = fs.readFileSync(__dirname + '/../fixtures/ZhsInstallEquipUpdWebservResponseOk.xml'),
    ZhsInstallEquipUpdWebservResponseError = fs.readFileSync(__dirname + '/../fixtures/ZhsInstallEquipUpdWebservResponseError.xml');

var validImage = {
  path: validImageCopyPath
};

var unsupportedImage = {
  path: invalidImagePath
};

var validPayload = JSON.stringify({
  lat: -32.6,
  lon: 120.45,
  serialNumber: '123456',
  failedPhoto: false
});

module.exports = function () {

  describe('sendMachineDetails', function () {

    describe('Failure tests', function () {

      it('should fail when no image is provided', function (done) {

        installService.sendMachineDetails(undefined, '', {}, function (err) {
          err.should.exist;
          err.message.should.equal('No image was uploaded');

          done();
        });

      });

      it('should fail when the image format is not supported', function (done) {

        installService.sendMachineDetails(unsupportedImage, '', {}, function (err) {
          err.should.exist;
          err.message.should.equal('Invalid mime type for image');

          done();
        });

      });

      it('should fail when the json payload is invalid', function (done) {

        installService.sendMachineDetails(validImage, 'invalid', {}, function (err) {
          err.should.exist;
          err.message.should.equal('Error parsing payload');

          done();
        });

      });

      it('should fail when one of the fields in the payload is invalid', function (done) {

        var invalidPayload = JSON.stringify({
          lat: -92.6,
          lon: 120.45,
          serialNumber: '123456'
        });

        installService.sendMachineDetails(validImage, invalidPayload, {}, function (err) {
          err.should.exist;
          err.message.should.equal('The structure of the payload is invalid');

          done();
        });

      });

      it('should fail when the WS returned an error response', function (done) {

        // Mock the WS response
        var wsMock = nock('https://qasecc.haascnc.com')
          .post('/sap/bc/srt/rfc/sap/zhs_install_equip_update_data/300/zhs_install_equip_update_data/zhs_install_equip_update_data')
          .reply(201, ZhsInstallEquipUpdWebservResponseError, {
            'Content-Type': 'application/xml'
          });

        installService.sendMachineDetails(validImage, validPayload, {}, function (err, machineDetails) {
          err.should.exist;
          err.message.should.equal('Image could not be attached to Equipment');

          // Assert that the mock was invoked
          wsMock.done();

          done();
        });

      });

    });

    describe('Success tests', function () {

      var clock, currentDate;

      before(function (done) {
        currentDate = new Date();
        clock = sinon.useFakeTimers(currentDate.getTime(), 'Date');

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
          .post('/sap/bc/srt/rfc/sap/zhs_install_equip_update_data/300/zhs_install_equip_update_data/zhs_install_equip_update_data')
          .reply(201, ZhsInstallEquipUpdWebservResponseOk, {
            'Content-Type': 'application/xml'
          });

        var user = {
          sapUsername: 'dummySapUsername'
        };

        installService.sendMachineDetails(validImage, validPayload, user, function (err, info, machineDetails) {
          should.not.exist(err);

          // Assert that the mock was invoked
          wsMock.done();

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

          info.should.eql({
            image: validImageCopyPath,
            params: {
              failedPhoto: false,
              lat: -32.6,
              lon: 120.45,
              serialNumber: '123456',
              timestamp: Math.floor(currentDate.getTime() / 1000),
              username: 'dummySapUsername'
            },
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
                Latitude: -32.6,
                Longitude: 120.45,
                Serno: '123456',
                Timestamp: Math.floor(currentDate.getTime() / 1000),
                Username: 'dummySapUsername'
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
        // Restore clock
        clock.restore();
      });

    });

  });

};
