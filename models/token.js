"use strict";

module.exports = function(sequelize, DataTypes) {

  var Token = sequelize.define('Token', {
    token     : { type: DataTypes.STRING(32), primaryKey: true },
    username  : DataTypes.STRING,
    expiration: DataTypes.DATE
  });

  return Token;
};
