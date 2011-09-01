(function() {
  var RPCState;
  RPCState = {
    IDLE: 0,
    QACK_SENT: 1,
    RESPONSE_SENT: 2,
    CONNECT_SENT: 3,
    QUERY_SENT: 4,
    AWAITING_RESPONSE: 5,
    TIMEDOUT: 6,
    DISCONNECT_SENT: 7,
    FRAGMENT_SENT: 8,
    FACK_RECEIVED: 9,
    FRAGMENT_RECEIVED: 10,
    FACK_SENT: 11,
    SEQNO_SENT: 12,
    CACK_SENT: 13
  };
  TestCase("Setting states", {
    setUp: function() {
      return this.jsrpc = new JSRPC();
    },
    "test_initial": function() {
      return assertEquals(RPCState.IDLE, this.jsrpc.getState());
    }
  });
}).call(this);
