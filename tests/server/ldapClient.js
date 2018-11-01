'use strict';

var sinon        = require('sinon'),
    ldap         = require('ldapjs'),
    util         = require('util'),
    EventEmitter = require('events').EventEmitter;

var LDAPClient = function () {
  this.connected = true;
};

util.inherits(LDAPClient, EventEmitter);

LDAPClient.prototype.bind   = function () {};
LDAPClient.prototype.search = function () {};
LDAPClient.prototype.unbind = function () {};

var ldapCreateClientStub = sinon.stub(ldap, 'createClient');

ldapCreateClientStub.returns(new LDAPClient);

module.exports = LDAPClient;
