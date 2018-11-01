'use strict';

var ldap   = require('ldapjs'),
    Joi    = require('joi'),
    crypto = require('crypto'),
    _      = require('lodash');

var config     = require('../config'),
    logger     = require('../config/logger'),
    models     = require('../models'),
    Token      = models.Token,
    errors     = require('../lib/errors'),
    errorCodes = require('../helpers/errorCodes');

var ldapClients = {};

_.each(config.ldap.servers, function(serverData) {
  var ldapClient = ldap.createClient({
    url           : serverData.url,
    // Tries to reconnect until it succeeds
    reconnect     : true,
    // Timeout for TCP connections
    connectTimeout: config.ldap.timeouts.connect,
    // Timeout for operations
    timeout       : config.ldap.timeouts.operations
  });

  ldapClients[serverData.url] = ldapClient;

  // Adding this event handler prevents the application from crashing because of an
  // unhandled event when the connection is lost
  ldapClient.on('error', function () {
    logger.warn('Connection droped by LDAP server: ' + serverData.url);
  });

  ldapClient.on('connectError', function () {
    logger.error('Error connecting to LDAP server: ' + serverData.url);
  });

  ldapClient.on('connect', function () {
    logger.info('Connected to LDAP server: ' + serverData.url);
  });
});

var userLoginSchema = Joi.object().keys({
  user: Joi.string().min(1).required(), // A string of at least one char
  pass: Joi.string().min(1).required() // A string of at least one char
});

module.exports.loginUser = function(params, callback) {
  Joi.validate(params, userLoginSchema, function (err, results) {
    if (err) {
      var errorCode = errorCodes.getErrorCode(err);
      return callback(new errors.BadRequestError('Username or password invalid', errorCode));
    }

    var password = results.pass,
        username = results.user;

    recursiveAuth(username, password, 0, callback);
  });
};

module.exports.validateToken = function(token, callback) {
  Token.findOne({
    where: {
      token: token
    }
  }).then(function(t) {
    if (t == null || t.expiration <= new Date()) {
      return callback(new errors.UnauthorizedError("Invalid or expired token"));
    }

    callback(null, {
      username: t.username
    });
  }).error(function (error) {
    callback(new errors.InternalServerError('Error while querying for token'));
  });
};

var recursiveAuth = function(username, password, serverIdx, callback) {
  logger.info("Trying with LDAP server # " + serverIdx);
  var isLastServer = serverIdx == config.ldap.servers.length - 1;

  authWithServer(config.ldap.servers[serverIdx], username, password, function(err, result) {
    if (err == null) {
      // success, we found the user
      return callback(null, result);
    } else if (isLastServer) {
      // the search failed in all servers
      return callback(err);
    } else {
      // else, we continue searching in other servers
      return recursiveAuth(username, password, serverIdx + 1, callback);
    }
  });
}

var authWithServer = function(server, username, password, callback) {
  var ldapClient = ldapClients[server.url];

  if (! ldapClient.connected) {
    logger.error("Connection to LDAP server is not established: " + server.url);
    return callback(new errors.InternalServerError("Connection to LDAP server is not established"));
  }

  ldapClient.bind(server.user, server.pass, function(err) {
    // established connection to LDAP with an admin account in order
    // to be able to find the actual DN of the user (if it exists!)
    if (err) {
      logger.error("Could not connect to LDAP server: " + err);
      // This resets the connected status for the client, thus allowing attempts
      // to stablish a new connection
      ldapClient.unbind(function () {
        // Connect to server, most likely it will fail but it will re-enable the
        // reconnection mechanism until it can establish a connection again
        ldapClient.connect();
      });
      // Request fails anyway, we can't wait for connection to be established
      return callback(new errors.InternalServerError("Authentication service unavailable"));
    }

    logger.info("Connected to LDAP as admin");

    var searchOpts = buildSearchOptions(server, username);
    ldapClient.search(server.searchBase, searchOpts, function(err, res) {
      if (err) {
        logger.error("Could not perform search in LDAP server: " + err);
        return callback(new errors.InternalServerError("Authentication service unavailable"));
      }

      res.on('error', function(err) {
        callback(new errors.InternalServerError("Authentication service unavailable"));
      });

      var foundUser = null;
      res.on('searchEntry', function(entry) {
        // we found something! hopefully, it's the user we're looking for
        foundUser = entry.object;

        var dn = foundUser.dn;
        logger.info("User found, trying authentication in LDAP with DN: " + dn);

        var newLdapClient = ldap.createClient({
          url: server.url
        });
        newLdapClient.bind(dn, password, function(err) {
          if (err) {
            // the username exists but the password won't let us in
            logger.info("Authentication failed: " + err);
            return callback(new errors.UnauthorizedError('Username or password invalid'));
          }
          var token = saveToken(username);
          var fullName = foundUser.givenName + " " + foundUser.sn;
          callback(null, {
            token: token,
            fullName: fullName
          });

          newLdapClient.unbind(); // close connection, we won't be needing it
        });
      });

      res.on('end', function(result) {
        if (foundUser == null) {
          // user account not found
          callback(new errors.UnauthorizedError('Username or password invalid'));
        }
      });

    });
  });
}

var saveToken = function (user) {
  var bytes = crypto.randomBytes(config.token.length);
  var token = bytes.toString('hex');
  // TODO: Check if token creation succeeded or not
  Token.create({
    token: token,
    username: user,
    expiration: new Date(new Date().getTime() + config.token.validTime * 1000)
  });
  return token;
};

var buildSearchOptions = function (server, user) {
  var filter = new ldap.AndFilter({
    filters: [
      new ldap.EqualityFilter({
        attribute: server.filterName,
        value: user
      }),
      new ldap.EqualityFilter({
        attribute: 'objectClass',
        value: 'user'
      })
    ]
  });

  var opts = {
    scope: 'sub',
    filter: filter
  };

  return opts;
};
