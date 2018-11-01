'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('Users')
      .then(function (result) {
        return queryInterface.createTable('Users', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          username    : { type: Sequelize.STRING, unique: true },
          sapUsername : Sequelize.STRING,
          lastUpdate  : Sequelize.DATE,
          firstName   : Sequelize.STRING,
          lastName    : Sequelize.STRING,
          techCertId  : Sequelize.STRING,
          createdAt : { type: Sequelize.DATE, allowNull: false },
          updatedAt : { type: Sequelize.DATE, allowNull: false }
        });
      });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('Users')
      .then(function (result) {
        return queryInterface.createTable('Users', {
          username    : { type: Sequelize.STRING, primaryKey: true },
          sapUsername : Sequelize.STRING,
          lastUpdate  : Sequelize.DATE,
          firstName   : Sequelize.STRING,
          lastName    : Sequelize.STRING,
          techCertId  : Sequelize.STRING,
          createdAt : { type: Sequelize.DATE, allowNull: false },
          updatedAt : { type: Sequelize.DATE, allowNull: false }
        });
      });
  }
};