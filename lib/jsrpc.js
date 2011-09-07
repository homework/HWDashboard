(function() {
  var EventEmitter, JSRPC, hwdbparser, pktr;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  EventEmitter = require('events').EventEmitter;
  pktr = require('./packeteer').packeteer;
  hwdbparser = require('./hwdbparser').hwdbparser;
  JSRPC = (function() {
    var Command, RPCState, lport, seqNo, state, subPort;
    __extends(JSRPC, EventEmitter);
    function JSRPC() {
      JSRPC.__super__.constructor.apply(this, arguments);
    }
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
      SEQNO_SENT: 12
    };
    state = RPCState.IDLE;
    seqNo = 0;
    subPort = Math.floor(Math.random() * 4294967296);
    lport = 0;
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
      pktr.on("command", __bind(function(sub_port, seq_no, command, data) {
        switch (command) {
          case Command.CONNECT:
            console.log("Got CONNECT");
            pktr.sendCommand(Command.CACK, "", sub_port, seq_no);
            return state = RPCState.IDLE;
          case Command.CACK:
            console.log("Got CACK");
            return state = RPCState.IDLE;
          case Command.QACK:
            console.log("Got QACK");
            return state = RPCState.AWAITING_RESPONSE;
          case Command.RESPONSE:
            console.log("Got RESPONSE:", data.slice(4));
            this.emit('message', hwdbparser.parseQueryOrResponse(data.slice(4)));
            pktr.sendCommand(Command.RACK, "", sub_port, seq_no);
            return state = RPCState.RACK;
          case Command.QUERY:
            console.log("Got QUERY:", data.slice(4));
            this.emit('message', hwdbparser.parseQueryOrResponse(data.slice(4)));
            pktr.sendCommand(Command.QACK, "", sub_port, seq_no);
            state = RPCState.QACK_SENT;
            pktr.sendCommand(Command.RESPONSE, "OK\0", sub_port, seq_no);
            return state = RPCState.RESPONSE_SENT;
          case Command.RACK:
            console.log("Got RACK");
            return state = RPCState.IDLE;
          case Command.PING:
            console.log("PING!");
            return pktr.sendCommand(Command.PACK);
        }
      }, this));
      if ((address != null) && (port != null)) {
        connectAddress = address;
        connectPort = port;
      }
      pktr.sendCommand(Command.CONNECT, "HWDB\0", subPort, seqNo);
      state = RPCState.CONNECT_SENT;
      return lport = pktr.listen();
    };
    JSRPC.prototype.query = function(query) {
      var query_header;
      query += lport + " Handler\0";
      query_header = String.fromCharCode(0) + String.fromCharCode(query.length);
      query_header += String.fromCharCode(0) + String.fromCharCode(query.length);
      query = query_header + query;
      process.nextTick(function() {
        return pktr.sendCommand(Command.QUERY, query, subPort, ++seqNo);
      });
      return state = RPCState.QUERY_SENT;
    };
    JSRPC.prototype.close = function() {
      return pktr.close();
    };
    return JSRPC;
  })();
  exports.jsrpc = new JSRPC;
}).call(this);
