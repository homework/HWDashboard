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
    var Command, RPCState, connected, idleInboundTimer, idleOutboundTimer, inboundSeqNo, inboundSubPort, lport, outboundSeqNo, outboundSubPort, pingInterval, state;
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
    connected = false;
    outboundSeqNo = 0;
    inboundSeqNo = 0;
    outboundSubPort = Math.floor(Math.random() * 4294967294);
    inboundSubPort = 0;
    lport = 0;
    idleOutboundTimer = 0;
    idleInboundTimer = 0;
    pingInterval = 15;
    JSRPC.prototype.setupCommandListener = function() {
      return pktr.on("command", __bind(function(sub_port, seq_no, command, data) {
        if (command === Command.FRAGMENT) {} else if (command === Command.PING) {
          console.log("PING!");
          return pktr.sendCommand(Command.PACK, "", sub_port, seq_no);
        } else if (sub_port === outboundSubPort) {
          console.log(seq_no, outboundSeqNo);
          if (seq_no < outboundSeqNo) {
            return console.log("Received old/repeat sequence number from responder");
          } else if (seq_no > (outboundSeqNo + 1)) {
            return console.log("Received sequence number too far ahead");
          } else {
            console.log("Sequence number is correct");
            switch (command) {
              case Command.CACK:
                if (state === RPCState.CONNECT_SENT) {
                  console.log("CONNECT acknowledged");
                  this.setState(RPCState.IDLE, 1);
                  this.emit('connected');
                  return connected = true;
                }
                break;
              case Command.QACK:
                console.log("QUERY acknowledged");
                if (state === RPCState.QUERY_SENT) {
                  if (seq_no === outboundSeqNo) {
                    return this.setState(RPCState.AWAITING_RESPONSE, 1);
                  }
                }
                break;
              case Command.RESPONSE:
                if ((state === RPCState.AWAITING_RESPONSE || RPCState.QUERY_SENT) && seq_no === outboundSeqNo) {
                  this.emit('message', hwdbparser.parseQueryOrResponse(data.slice(4)));
                  pktr.sendCommand(Command.RACK, "", outboundSubPort, outboundSeqNo);
                  console.log("RESPONSE received:", data.slice(4));
                  return this.setState(RPCState.IDLE, 1);
                }
                break;
              case Command.SACK:
                console.log("SEQNO acknowledged");
                this.setState(RPCState.IDLE, 1);
                return this.emit('SACK');
              case Command.DACK:
                console.log("DISCONNECT acknowledged");
                pktr.close();
                return this.emit('disconnected');
              case Command.PACK:
                this.clearIdleTimer(1);
                console.log("PACK cleared");
                return this.setState(RPCState.IDLE, 1);
            }
          }
        } else if (sub_port === inboundSubPort || inboundSubPort === 0) {
          if (inboundSubPort === 0) {
            inboundSubPort = sub_port;
            inboundSeqNo = seq_no;
          }
          console.log(seq_no, inboundSeqNo);
          if (command === Command.SEQNO) {
            console.log("Server requesting SEQNO reset");
            if (state === RPCState.RESPONSE_SENT) {
              console.log("Server didn't get our RACK");
              this.setState(RPCState.IDLE, 0);
            }
            if (state === RPCState.IDLE) {
              inboundSeqNo = seq_no;
              pktr.sendCommand(Command.SACK, "", sub_port, inboundSeqNo);
            }
          }
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
                return this.setState(RPCState.IDLE, 0);
              case Command.QUERY:
                console.log("Got QUERY:", data.slice(4));
                this.emit('message', hwdbparser.parseQueryOrResponse(data.slice(4)));
                pktr.sendCommand(Command.QACK, "", inboundSubPort, ++inboundSeqNo);
                this.setState(RPCState.QACK_SENT, 0);
                pktr.sendCommand(Command.RESPONSE, "OK\0", inboundSubPort, inboundSeqNo);
                return this.setState(RPCState.RESPONSE_SENT, 0);
              case Command.RACK:
                if (state === RPCState.RESPONSE_SENT && seq_no === inboundSeqNo) {
                  console.log("Got RACK");
                  return this.setState(RPCState.IDLE, 0);
                }
                break;
              case Command.DISCONNECT:
                console.log("Server requesting disconnect");
                pktr.sendCommand(Command.DACK, "", inboundSubPort, inboundSeqNo);
                return this.setState(RPCState.TIMEDOUT, 0);
              case Command.PACK:
                this.clearIdleTimer(0);
                console.log("PACK cleared");
                return this.setState(RPCState.IDLE, 0);
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
    JSRPC.prototype.setState = function(new_state, direction) {
      state = new_state;
      console.log("New state:", state);
      if (state === RPCState.IDLE) {
        return this.setIdleTimer(direction);
      } else {
        return this.clearIdleTimer(direction);
      }
    };
    JSRPC.prototype.setIdleTimer = function(direction, ticks) {
      if (ticks == null) {
        ticks = 3;
      }
      if (ticks === 0) {
        this.setState(RPCState.TIMEDOUT);
        pktr.close();
        return this.emit('timedout');
      } else if (direction === 0) {
        clearTimeout(idleInboundTimer);
        console.log("Setting inbound timer");
        return idleInboundTimer = setTimeout(__bind(function() {
          console.log("Inbound RAN");
          pktr.sendCommand(Command.PING, "", inboundSubPort, inboundSeqNo);
          return this.setIdleTimer(direction, ticks - 1);
        }, this), pingInterval * 1000);
      } else if (direction === 1) {
        clearTimeout(idleOutboundTimer);
        console.log("Setting outbound timer");
        return idleOutboundTimer = setTimeout(__bind(function() {
          console.log("Outbound RAN");
          pktr.sendCommand(Command.PING, "", outboundSubPort, outboundSeqNo);
          return this.setIdleTimer(direction, ticks - 1);
        }, this), pingInterval * 1000);
      }
    };
    JSRPC.prototype.clearIdleTimer = function(direction) {
      if (direction === 0) {
        console.log("Clearing inbound timer");
        clearTimeout(idleInboundTimer);
        return idleInboundTimer = 0;
      } else if (direction === 1) {
        console.log("Clearing timer");
        clearTimeout(idleOutboundTimer);
        return idleOutboundTimer = 0;
      }
    };
    JSRPC.prototype.connect = function(address, port) {
      var connectAddress, connectPort;
      this.setupCommandListener();
      if ((address != null) && (port != null)) {
        connectAddress = address;
        connectPort = port;
      }
      this.setState(RPCState.CONNECT_SENT);
      pktr.sendCommand(Command.CONNECT, "HWDB\0", outboundSubPort, outboundSeqNo);
      return lport = pktr.listen();
    };
    JSRPC.prototype.query = function(query) {
      var query_header;
      query += lport + " Handler\0";
      query_header = String.fromCharCode(0) + String.fromCharCode(query.length);
      query_header += String.fromCharCode(0) + String.fromCharCode(query.length);
      query = query_header + query;
      if (connected) {
        if (outboundSeqNo >= 4294967294) {
          outboundSeqNo = 0;
          pktr.sendCommand(Command.SEQNO, "", outboundSubPort, outboundSeqNo);
          return this.once('SACK', function() {
            return pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo);
          });
        } else {
          pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo);
          return this.setState(RPCState.QUERY_SENT);
        }
      } else {
        return this.once('connected', function() {
          pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo);
          return this.setState(RPCState.QUERY_SENT);
        });
      }
    };
    JSRPC.prototype.disconnect = function() {
      pktr.sendCommand(Command.DISCONNECT, "", outboundSubPort, outboundSeqNo);
      return this.setState(RPCState.DISCONNECT_SENT);
    };
    return JSRPC;
  })();
  exports.jsrpc = new JSRPC;
}).call(this);
