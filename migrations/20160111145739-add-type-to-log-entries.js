'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('LogEntries', 'type', {
      type: Sequelize.ENUM('success', 'error'),
      defaultValue: 'success',
      allowNull: false
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('LogEntries', 'type');
  }
};
