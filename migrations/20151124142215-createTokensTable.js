'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('Tokens', {
      token     : { type: Sequelize.STRING(32), primaryKey: true },
      username  : Sequelize.STRING,
      expiration: Sequelize.DATE,
      createdAt : { type: Sequelize.DATE, allowNull: false },
      updatedAt : { type: Sequelize.DATE, allowNull: false }
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Tokens');
  }
};
