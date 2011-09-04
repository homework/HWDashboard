var JSRPC;
JSRPC = (function() {
  var Command, RPCState, connectAddress, connectPort, outbound_socket, seqNo, state, subPort, udp;
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
  udp = require('dgram');
  outbound_socket = udp.createSocket("udp4");
  seqNo = 1;
  subPort = Math.floor(Math.random() * 4294967296);
  connectAddress = '192.168.1.1';
  connectPort = 987;
  JSRPC.prototype.getCommands = function() {
    return Command;
  };
  JSRPC.prototype.getRPCStates = function() {
    return RPCState;
  };
  JSRPC.prototype.getState = function() {
    return state;
  };
  JSRPC.prototype.intToByteArray = function(number, width) {
    var bArray, hex_string, i, x, _ref, _ref2;
    bArray = [];
    hex_string = number.toString(16);
    if ((hex_string.length % 2) !== 0) {
      hex_string = "0" + hex_string;
    }
    for (x = 0, _ref = (hex_string.length / 2) - width; 0 <= _ref ? x < _ref : x > _ref; 0 <= _ref ? x++ : x--) {
      bArray.push(0);
    }
    for (i = 0, _ref2 = hex_string.length / 2; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
      bArray.push(parseInt(hex_string.slice(i * 2, ((i * 2) + 1 + 1) || 9e9), 16));
    }
    return bArray;
  };
  JSRPC.prototype.sendCommand = function(command, data, sub_port, seq_no) {
    var byteArray, i, prepped_data, _ref;
    byteArray = [];
    byteArray = byteArray.concat(this.intToByteArray(sub_port, 4));
    byteArray = byteArray.concat(this.intToByteArray(seq_no, 4));
    byteArray = byteArray.concat(this.intToByteArray(command, 2));
    byteArray.push(1);
    byteArray.push(1);
    for (i = 0, _ref = data.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
      byteArray.push(data.charCodeAt(i));
    }
    prepped_data = new Buffer(byteArray);
    return outbound_socket.send(prepped_data, 0, prepped_data.length, connectPort, connectAddress);
  };
  JSRPC.prototype.connect = function(address, port) {
    if ((address != null) && (port != null)) {
      connectAddress = address;
      connectPort = port;
    }
    this.sendCommand(Command.CONNECT, "HWDB\0", subPort, seqNo);
    state = RPCState.CONNECT_SENT;
    return outbound_socket.close();
  };
  return JSRPC;
})();
exports.jsrpc = JSRPC;