'use strict';

var fs     = require('fs'),
    piexif = require("piexifjs"),
    geo    = require('mt-geo'),
    async  = require('async');

module.exports.addExifData = function (imagePath, params, callback) {

  async.waterfall([
    function (callback) {
      fs.readFile(imagePath, function (err, jpeg) {
        if (err) {
          return callback(err);
        }

        callback(null, jpeg.toString("binary"));
      });
    },

    function (jpegData, callback) {
      callback(null, jpegData, getExifData(params));
    },

    function (jpegData, exifBytes, callback) {
      var newJpegData;
      try {
        newJpegData = piexif.remove(jpegData);
      } catch (err) {
        newJpegData = jpegData;
      }

      newJpegData = piexif.insert(exifBytes, newJpegData);
      var newJpeg = new Buffer(newJpegData, "binary");

      fs.writeFile(imagePath, newJpeg, callback);
    }
  ], callback);
};

var getExifData = function (params) {
  var zeroth = {},
      exif = {},
      gps = {};

  zeroth[piexif.ImageIFD.DateTime] = new Date();

  var latitudeDeg = geo.toLat(params.latitude, 'dms', 2);
  var longitudeDeg = geo.toLon(params.longitude, 'dms', 2);

  var latParts = extractDMSParts(latitudeDeg);
  var longParts = extractDMSParts(longitudeDeg);

  gps[piexif.GPSIFD.GPSAltitude] = [0, 1];
  gps[piexif.GPSIFD.GPSAltitudeRef] = 0;
  gps[piexif.GPSIFD.GPSLatitude] = [ [latParts.deg, 1], [latParts.min, 1], [latParts.sec * 100, 100] ];
  gps[piexif.GPSIFD.GPSLatitudeRef] = latParts.ref;
  gps[piexif.GPSIFD.GPSLongitude] = [ [longParts.deg, 1], [longParts.min, 1], [longParts.sec * 100, 100] ];
  gps[piexif.GPSIFD.GPSLongitudeRef] = longParts.ref;
  gps[piexif.GPSIFD.GPSVersionID] = [2, 2, 0, 0];

  var exifObj = {
    "0th": zeroth,
    "Exif":exif,
    "GPS":gps
  };

  return piexif.dump(exifObj);
};

var extractDMSParts = function (dms) {
  var parts = dms.match(/^(\d+)°(\d)+′([\d\.]+)″([NSWE])$/);

  return {
    deg: parts[1],
    min: parts[2],
    sec: parts[3],
    ref: parts[4]
  }
};
