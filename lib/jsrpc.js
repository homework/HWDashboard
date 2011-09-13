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
    var Command, RPCState, inboundSeqNo, inboundSubPort, lport, outboundSeqNo, outboundSubPort, state;
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
    outboundSeqNo = 0;
    inboundSeqNo = 0;
    outboundSubPort = Math.floor(Math.random() * 4294967296);
    inboundSubPort = 0;
    lport = 0;
    JSRPC.prototype.setupCommandListener = function() {
      return pktr.on("command", __bind(function(sub_port, seq_no, command, data) {
        if (command === Command.FRAGMENT) {} else if (command === Command.PING) {
          console.log("PING!");
          return pktr.sendCommand(Command.PACK, "", sub_port, seq_no);
        } else if (command === Command.PACK) {} else if (sub_port === outboundSubPort) {
          console.log(seq_no, outboundSeqNo);
          if (seq_no < outboundSeqNo) {
            return console.log("Received old/repeat sequence number from responder");
          } else if (seq_no > (outboundSeqNo + 1)) {
            return console.log("Received sequence number too far ahead");
          } else {
            console.log("Sequence number is correct");
            switch (command) {
              case Command.CACK:
                console.log("CONNECT acknowledged");
                state = RPCState.IDLE;
                return this.emit('connected');
              case Command.QACK:
                console.log("QUERY acknowledged");
                return state = RPCState.AWAITING_RESPONSE;
              case Command.RESPONSE:
                console.log("RESPONSE received:", data.slice(4));
                this.emit('message', hwdbparser.parseQueryOrResponse(data.slice(4)));
                pktr.sendCommand(Command.RACK, "", outboundSubPort, outboundSeqNo);
                return state = RPCState.IDLE;
              case Command.SACK:
                return console.log("SEQNO acknowledged");
              case Command.DACK:
                console.log("DISCONNECT acknowledged");
                return pktr.close();
            }
          }
        } else if (sub_port === inboundSubPort || inboundSubPort === 0) {
          if (inboundSubPort === 0) {
            inboundSubPort = sub_port;
            inboundSeqNo = seq_no;
          }
          console.log(seq_no, inboundSeqNo);
          if (seq_no < inboundSeqNo) {
            return console.log("Received old/repeat sequence number from requestor");
          } else if (seq_no > (inboundSeqNo + 1)) {
            return console.log("Received sequence number too far ahead from requestor");
          } else {
            console.log("Sequence number is correct");
            switch (command) {
              case Command.CONNECT:
                console.log("Got CONNECT");
                pktr.sendCommand(Command.CACK, "", inboundSubPort, inboundSeqNo);
                return state = RPCState.IDLE;
              case Command.QUERY:
                console.log("Got QUERY:", data.slice(4));
                this.emit('message', hwdbparser.parseQueryOrResponse(data.slice(4)));
                pktr.sendCommand(Command.QACK, "", inboundSubPort, ++inboundSeqNo);
                state = RPCState.QACK_SENT;
                pktr.sendCommand(Command.RESPONSE, "OK\0", inboundSubPort, inboundSeqNo);
                return state = RPCState.RESPONSE_SENT;
              case Command.RACK:
                console.log("Got RACK");
                return state = RPCState.IDLE;
              case Command.DISCONNECT:
                console.log("Server requesting disconnect");
                pktr.sendCommand(Command.DACK, "", inboundSubPort, inboundSeqNo);
                return state = RPCState.TIMEDOUT;
              case Command.SEQNO:
                return console.log("Server requesting SEQNO reset");
            }
          }
        }
      }, this));
    };
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
      this.setupCommandListener();
      if ((address != null) && (port != null)) {
        connectAddress = address;
        connectPort = port;
      }
      pktr.sendCommand(Command.CONNECT, "HWDB\0", outboundSubPort, outboundSeqNo);
      state = RPCState.CONNECT_SENT;
      return lport = pktr.listen();
    };
    JSRPC.prototype.query = function(query) {
      var query_header;
      query += lport + " Handler\0";
      query_header = String.fromCharCode(0) + String.fromCharCode(query.length);
      query_header += String.fromCharCode(0) + String.fromCharCode(query.length);
      query = query_header + query;
      this.once('connected', function() {
        return pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo);
      });
      return state = RPCState.QUERY_SENT;
    };
    JSRPC.prototype.disconnect = function() {
      pktr.sendCommand(Command.DISCONNECT, query, outboundSubPort, outboundSeqNo);
      return state = RPCState.DISCONNECT_SENT;
    };
    return JSRPC;
  })();
  exports.jsrpc = new JSRPC;
}).call(this);
