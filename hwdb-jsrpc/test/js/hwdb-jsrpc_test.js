(function() {
  var Command, JSRPC, RPCState, jc, testCase;
  testCase = require('nodeunit').testCase;
  JSRPC = require('../../lib/hwdb-jsrpc.min').jsrpc;
  jc = new JSRPC();
  RPCState = jc.getRPCStates();
  Command = jc.getCommands();
  exports['Tests from initial state'] = testCase({
    setUp: function(callback) {
      this.jc_obj = new JSRPC();
      return callback();
    },
    test_initial: function(test) {
      test.equals(RPCState.IDLE, this.jc_obj.getState());
      return test.done();
    },
    test_connect: function(test) {
      this.jc_obj.connect();
      test.equals(RPCState.CONNECT_SENT, this.jc_obj.getState());
      return test.done();
    },
    tearDown: function(callback) {
      return callback();
    }
  });
}).call(this);
