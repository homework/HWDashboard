(function() {
  var Command, RPCState, jc, testCase;
  testCase = require('nodeunit').testCase;
  jc = require('../../lib/jsrpc').jsrpc;
  RPCState = jc.getRPCStates();
  Command = jc.getCommands();
  exports['Tests from initial state'] = testCase({
    setUp: function(callback) {
      return callback();
    },
    test_initial: function(test) {
      test.equals(RPCState.IDLE, jc.getState());
      return test.done();
    },
    test_connect: function(test) {
      jc.connect();
      test.equals(RPCState.CONNECT_SENT, jc.getState());
      return test.done();
    },
    tearDown: function(callback) {
      return callback();
    }
  });
}).call(this);
