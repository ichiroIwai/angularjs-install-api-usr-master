'use strict';

module.exports = function () {

  describe('Services', function () {

    describe('Install Service', require('./services/installService'));
    describe('Validation Service', require('./services/validationService'));
    describe('Image Service', require('./services/imageService'));
    describe('SAP Service', require('./services/sapService'));
    describe('Auth Service', require('./services/ldapAuthService'));
    describe('User Data Service', require('./services/userDataService'));
    describe('User Service', require('./services/userService'));
    describe('Actions Log Service', require('./services/actionsLogService'));

  });

  describe('Models', function () {

    describe('Log Entry Model', require('./models/logEntryModel'));

  });

};
