'use strict';

var Sequelize = require('sequelize'),
    _ = require('lodash');

var config = require('../config');

var db = {};

// Set connection to database
var sequelize = new Sequelize(config.database.db, config.database.user, config.database.pass, {
  host   : config.database.host,
  dialect: config.database.dialect,
  port   : config.database.port
});

// Include models
db.Token    = sequelize.import('./token');
db.User     = sequelize.import('./user');
db.LogEntry = sequelize.import('./logentry');

// TODO: Add relations between models here
_.each(db, function (model) {
  if (model.associate !== undefined) {
    model.associate(db);
  }
});

// Not sure if this is useful, maybe for transactions
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// This module behaves as a singleton, models can be
// retrieved by including it
module.exports = db;
