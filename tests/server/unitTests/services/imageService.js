'use strict';

var should    = require('should'),
    sinon     = require('sinon'),
    piexif = require("piexifjs"),
    fs = require('fs');

var imageService = require('../../../../services/imageService');

var validImagePath     = __dirname + '/../fixtures/uploadImage.jpg',
    validImageCopyPath = __dirname + '/../fixtures/uploadImageCopy.jpg';

module.exports = function () {

  describe('addExifData', function () {

    describe('Failure tests', function () {

      it('should fail when no image is found in the given path', function (done) {

        imageService.addExifData('dummy/path', {}, function (err) {
          err.should.exist;
          err.errno.should.equal(-2);
          err.message.indexOf("ENOENT").should.equal(0);

          done();
        });

      });

    });

    describe('Success tests', function () {

      var originalExifData, clock, currentDate;

      before(function (done) {
        currentDate = new Date();
        clock = sinon.useFakeTimers(currentDate.getTime(), 'Date');

        fs.readFile(validImagePath, function (err, data) {
          if (err) {
            return done(err);
          }

          var jpegData = data.toString("binary");
          originalExifData = piexif.load(jpegData);

          fs.writeFile(validImageCopyPath, data, done);
        });
      });

      it('should add the passed EXIF data to the image', function (done) {

        var params = {
          latitude: -32.6443,
          longitude: 120.45211,
          serialNumber: '123456'
        };

        imageService.addExifData(validImageCopyPath, params, function (err) {
          should.not.exist(err);

          fs.readFile(validImageCopyPath, function (err, jpeg) {
            if (err) {
              return done(err);
            }

            var jpegData = jpeg.toString("binary");
            var exifObj = piexif.load(jpegData);

            exifObj.should.not.eql(originalExifData);

            exifObj.Exif.should.exist;
            exifObj.GPS.should.exist;
            // Date field
            exifObj['0th']['306'].should.exist;
            exifObj['0th']['306'].should.equal(currentDate.toISOString());

            exifObj.GPS.should.eql({
              '0': [ 2, 2, 0, 0 ],
              '1': 'S',
              '2': [ [ 32, 1 ], [ 8, 1 ], [ 3947, 100 ] ],
              '3': 'E',
              '4': [ [ 120, 1 ], [ 7, 1 ], [ 760, 100 ] ],
              '5': 0,
              '6': [ 0, 1 ]
            });

            done();
          });

        });

      });

      after(function () {
        clock.restore();
      });

    });

  });

};
