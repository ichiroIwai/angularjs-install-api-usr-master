'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('LogEntries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type:          Sequelize.INTEGER,
        references:    'Users',
        referencesKey: 'id',
        onUpdate:      'CASCADE',
        onDelete:      'CASCADE'
      },
      timestamp: {
        type: Sequelize.DATE
      },
      action: {
        type: Sequelize.STRING
      },
      data: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('LogEntries');
  }
};