'use strict';
module.exports = function(sequelize, DataTypes) {

  var LogEntry = sequelize.define('LogEntry', {
    timestamp: DataTypes.DATE,
    action   : DataTypes.STRING,
    data     : {
      type: DataTypes.TEXT,
      set: function (val) {
        // Set a default in order to circumvent the limitation of not being able
        // to set a default value for TEXT fields in mysql
        this.setDataValue('data', JSON.stringify(val || {}));
      },
      get: function (val) {
        // Get a default in order to circumvent the limitation of not being able
        // to set a default value for TEXT fields in mysql
        return JSON.parse(this.getDataValue('data') || '{}');
      }
    },
    type     : { type: DataTypes.ENUM('success', 'error'), defaultValue: 'success', allowNull: false }
  }, {
    classMethods: {
      associate: function(models) {
        LogEntry.belongsTo(models.User, {
          onDelete: 'CASCADE',
          foreignKey: 'userId'
        });
      }
    },
    getterMethods: {
      sapParams: function()  {
        return this.data.wsArgs || {};
      },
      params: function()  {
        return this.data.params || {};
      },
      response: function () {
        return this.data.response || {};
      },
      location: function()  {
        var location;

        switch (this.action) {
          case 'machine-details':
            location = {
              latitude: this.data.params.lat,
              longitude: this.data.params.lon
            };
            break;
          case 'validate-location':
          case 'update-location':
            location = {
              latitude: this.data.params.location.latitude,
              longitude: this.data.params.location.longitude
            };
            break;
        }

        return location;
      },
      customerLocation: function()  {
        var location;

        if (this.type !== 'success') {
          return location;
        }

        switch (this.action) {
          case 'machine-details':
            location = {
              latitude: this.data.response.EsOutput.LatitudeEndcust,
              longitude: this.data.response.EsOutput.LongitudeEndcust
            };
            break;
        }

        return location;
      },
      image: function() {
        return this.data.image;
      },
      serialNumber: function() {
        var serialNumber;

        switch (this.action) {
          case 'machine-details':
          case 'validate-location':
          case 'update-location':
          case 'get-activation-code':
            serialNumber = this.data.params.serialNumber;
            break;
        }

        return serialNumber;
      }
    }
  });

  return LogEntry;

};
