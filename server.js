'use strict';

if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production") {
  require('newrelic');
}

var express = require('express'),
    bodyParser = require('body-parser'),
    compression = require('compression');

var app = express(),
    config = require('./config'),
    logger = require('./config/logger');

app.set('x-powered-by', false);

// Set required third party middlewares
app.use(compression());
app.use(bodyParser.json());

// Path for static files
app.use(express.static(__dirname + '/public'));

// Path for uploads
app.use('/uploads', express.static(__dirname + '/uploads'));

// Include models
var db = require('./models');

// Include routes
require('./routes')(app);

// Add a post-middleware that will take care of adding a log entry
app.use(require('./middlewares/actionsLogMiddleware'));

// If no route handled the request then this one will be used
app.use(require('./middlewares/notFoundMiddleware'));

// Error handlers are special cases of middlewares
app.use(require('./middlewares/actionsLogErrorMiddleware'));
app.use(require('./middlewares/errorResponseMiddleware'));

// Check connection to db
db.sequelize.authenticate().then(function() {
  logger.info('Opened connection to database');

  // Issue the command to check db schema
  return db.sequelize.sync();
}).then(function () {
  // Start express server
  app.listen(config.api.port, function () {
      logger.info('Started Install App API server on port ' + config.api.port);
  });
}).error(function() {
  logger.error('Connection to db failed');
});
