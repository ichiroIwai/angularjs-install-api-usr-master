'use strict';

var multer  = require('multer');

var config = require('../config');

var storage = multer.diskStorage({
  destination: config.imageUploads.path,

  filename: function (req, file, cb) {
    var mimeTypeParts = file.mimetype.split('/');
    cb(null, file.fieldname + '-' + Date.now() + '.' + mimeTypeParts.pop());
  }
});

var upload = multer({
  storage: storage,
  limits: {
    files: 1,
    fileSize: config.imageUploads.maxSize
  }
});

module.exports =  upload.single('photo');
