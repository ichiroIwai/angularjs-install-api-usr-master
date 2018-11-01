"use strict";

module.exports = function(sequelize, DataTypes) {

  var User = sequelize.define('User', {
    username    : { type: DataTypes.STRING, unique: true },
    sapUsername : DataTypes.STRING,
    lastUpdate  : DataTypes.DATE,
    firstName   : DataTypes.STRING,
    lastName    : DataTypes.STRING,
    techCertId  : DataTypes.STRING,
    isAdmin     : { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
    classMethods: {
      associate: function(models) {
        User.hasMany(models.LogEntry, {
          onDelete: 'CASCADE',
          foreignKey: 'userId'
        });
      }
    }
  });

  return User;
};
