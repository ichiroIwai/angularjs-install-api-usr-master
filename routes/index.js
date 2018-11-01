'use strict';

var multer  = require('multer');

var config = require('../config');

var authController       = require('../controllers/authController'),
    echoController       = require('../controllers/echoController'),
    installController    = require('../controllers/installController'),
    validationController = require('../controllers/validationController'),
    actionsLogController  = require('../controllers/actionsLogController');

var imageUploadMiddleware = require('../middlewares/imageUploadMiddleware'),
    authMiddleware        = require('../middlewares/authMiddleware'),
    adminAuthMiddleware   = require('../middlewares/adminAuthMiddleware');

var imageAndAuthMiddleware = [ authMiddleware, imageUploadMiddleware ];

module.exports = function (app) {
  // Authentication
  app.post('/login', authController.login);
  app.post('/iap/check-session', authMiddleware, authController.checkToken);

  // Echo
  app.post('/echo', authMiddleware, echoController.echo);

  // Install app endpoints
  app.post('/iap/machine-details', imageAndAuthMiddleware, installController.postMachineDetails);
  app.post('/iap/get-activation-code', authMiddleware, installController.postActivationCode);

  // Validation app endpoints
  app.post('/iap/validate-location', authMiddleware, validationController.postValidateLocation);
  app.post('/iap/update-location', imageAndAuthMiddleware, validationController.postUpdateLocation);
  app.post('/iap/corrective-action', authMiddleware, validationController.postCorrectiveAction);

  // Admin endpoints
  app.post('/admin/login', authController.adminLogin);

  // Action log endpoints
  app.get('/admin/logEntries', adminAuthMiddleware, actionsLogController.getLogEntries);
  app.get('/admin/logEntries/:id', adminAuthMiddleware, actionsLogController.getLogEntry);
};
