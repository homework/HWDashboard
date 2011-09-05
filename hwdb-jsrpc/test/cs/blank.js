(function() {
  var JSRPC, jc, testCase;
  testCase = require('nodeunit').testCase;
  JSRPC = require('../../lib/jsrpc').jsrpc;
  jc = new JSRPC();
  jc.connect();
}).call(this);
