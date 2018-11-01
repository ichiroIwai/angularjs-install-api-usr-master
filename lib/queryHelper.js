'use strict';

var models = require('../models');

module.exports.buildPaginationParams = function (query) {
  var count   = query.count   || 10,
      page    = query.page    || 1,
      sorting = query.sorting || { };

  var order = [];

  for (var key in sorting) {
    // To sort on fields in related models the syntax is like [ User, 'sapUsername', 'asc' ]
    // When sorting by related models, the keys of the sorting object should
    // be of the form 'User.sapUsername'
    var orderParts = key.split('.');

    // Set the model for each part
    for (var i = 0; i < orderParts.length - 1; i++) {
      orderParts[i] = models[orderParts[i]];
    }
    // Add the sorting direction
    orderParts.push(sorting[key]);

    order.push(orderParts);
  }

  return {
    limit:  count,
    offset: (page - 1) * count,
    order:  order
  };
};
