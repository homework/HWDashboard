(function() {
  var JSRPC, pktr;
  pktr = require('./packeteer').packeteer;
  JSRPC = (function() {
    var Command, RPCState, seqNo, state, subPort;
    function JSRPC() {}
    Command = {
      ERROR: 0,
      CONNECT: 1,
      CACK: 2,
      QUERY: 3,
      QACK: 4,
      RESPONSE: 5,
      RACK: 6,
      DISCONNECT: 7,
      DACK: 8,
      FRAGMENT: 9,
      FACK: 10,
      PING: 11,
      PACK: 12,
      SEQNO: 13,
      SACK: 14
    };
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
    state = RPCState.IDLE;
    seqNo = 1;
    subPort = Math.floor(Math.random() * 4294967296);
    pktr.on('command', function(sub_port, seq_no, command, data) {
      return console.log(sub_port, seq_no, command, data);
    });
    JSRPC.prototype.getCommands = function() {
      return Command;
    };
    JSRPC.prototype.getRPCStates = function() {
      return RPCState;
    };
    JSRPC.prototype.getState = function() {
      return state;
    };
    JSRPC.prototype.connect = function(address, port) {
      var connectAddress, connectPort;
      if ((address != null) && (port != null)) {
        connectAddress = address;
        connectPort = port;
      }
      pktr.sendCommand(Command.CONNECT, "HWDB\0", subPort, seqNo);
      return pktr.listen();
    };
    return JSRPC;
  })();
  exports.jsrpc = JSRPC;
}).call(this);
