'use strict';

var config = require('./index');

var dbConfig = {};

// The sequelize-cli config file should return
// the settings for all environments. In this
// case we rely on the user invoking the migrations
// using a command like the following
// $ NODE_ENV=production sequelize-cli db:migrate

dbConfig[config.environment] = {
  username: config.database.user,
  password: config.database.pass,
  database: config.database.db,
  host    : config.database.host,
  port    : config.database.port,
  dialect : config.database.dialect
};

module.exports = dbConfig;
