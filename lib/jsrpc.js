(function() {
  var EventEmitter, JSRPC;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  EventEmitter = require('events').EventEmitter;
  JSRPC = (function() {
    var Command, Defragger, HWDashboardLogger, Packeteer, RPCState, hwdbparser;
    __extends(JSRPC, EventEmitter);
    hwdbparser = require('./hwdbparser').hwdbparser;
    Packeteer = require('./packeteer').packeteer;
    Defragger = require('./defragger').defragger;
    HWDashboardLogger = require('./logger').logger;
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
    function JSRPC(rs) {
      this.pktr = new Packeteer;
      this.defrag = new Defragger();
      this.log = new HWDashboardLogger("jsrpc", 7);
      this.state = RPCState.IDLE;
      this.connected = false;
      this.outboundSeqNo = 0;
      this.inboundSeqNo = 0;
      this.outboundSubPort = Math.floor(Math.random() * 4294967294);
      this.inboundSubPort = 0;
      this.lport = 0;
      this.idleOutboundTimer = 0;
      this.idleInboundTimer = 0;
      this.pingInterval = 15;
    }
    JSRPC.prototype.setupCommandListener = function() {
      return this.pktr.on("command", __bind(function(sub_port, seq_no, command, data, frag_count, frag_no) {
        var fragment_length, total_length;
        if (frag_count === frag_no && frag_count !== 1) {
          if (this.defrag.getTotalLength() === 0) {
            return this.pktr.sendCommand(Command.RACK, "", sub_port, seq_no);
          } else {
            this.defrag.push(frag_count, data.slice(4));
            this.pktr.emit("command", sub_port, seq_no, command, this.defrag.getData(), 1, 1);
            this.defrag.reset();
          }
        } else {
          this.log.debug("Command: " + command + ", " + frag_count + ", " + frag_no + " SP: " + sub_port);
          if (command === Command.FRAGMENT) {
            if (sub_port === this.outboundSubPort) {
              if (seq_no === this.outboundSeqNo || seq_no === this.outboundSeqNo + 1) {
                this.log.debug("Fragment sequence number is correct");
                total_length = this.pktr.bufToInt(new Buffer(data.slice(0, 2)), 2);
                fragment_length = this.pktr.bufToInt(new Buffer(data.slice(2, 4)), 2);
                this.log.debug("Fragment number: " + frag_count + "/" + frag_no);
                if (this.state === RPCState.AWAITING_RESPONSE) {
                  if (seq_no === this.outboundSeqNo && frag_count === 1) {
                    this.defrag = new Defragger();
                    this.defrag.setup(frag_count, total_length);
                    this.defrag.push(frag_count, data.slice(4));
                    this.log.debug("Pushed first fragment into Defragger from server");
                    this.setState(RPCState.FACK_SENT, 1);
                    return this.pktr.sendCommand(Command.FACK, "", sub_port, outboundSeqNo, frag_count, frag_no);
                  }
                } else if (this.state === RPCState.FACK_SENT) {
                  if (seq_no === this.outboundSeqNo && this.defrag.getTotalLength()) {
                    if ((this.defrag.push(frag_count, data.slice(4))) === frag_count) {
                      this.log.debug("Pushed new fragment into Defragger from server");
                      this.setState(RPCState.FACK_SENT, 1);
                      return this.pktr.sendCommand(Command.FACK, "", sub_port, outboundSeqNo, frag_count, frag_no);
                    }
                  }
                }
              }
            } else if (sub_port === this.inboundSubPort) {
              if (seq_no === this.inboundSeqNo || seq_no === this.inboundSeqNo + 1) {
                this.log.debug("Fragment sequence number is correct");
                fragment_length = data.slice(0, 1);
                total_length = data.slice(1, 2);
                this.log.debug("Fragment number:" + frag_count + "/" + frag_no);
                if (this.state === RPCState.RESPONSE_SENT && seq_no === (this.inboundSeqNo + 1) && frag_no === 1) {
                  this.setState(RPCState.IDLE, 0);
                }
                if (this.state === RPCState.IDLE) {
                  this.defrag = new Defragger();
                  this.defrag.setup(frag_count, total_length);
                  this.defrag.push(frag_count, data.slice(4));
                  this.log.debug("Pushed first fragment into Defragger from client");
                  this.setState(RPCState.FACK_SENT, 0);
                  return this.pktr.sendCommand(Command.FACK, "", sub_port, ++this.inboundSeqNo);
                } else if (this.state === RPCState.FACK_SENT) {
                  if (seq_no === this.inboundSeqNo && this.defrag.getTotalLength()) {
                    if ((this.defrag.push(frag_no, data.slice(4))) === frag_count) {
                      this.log.debug("Pushed new fragment into Defragger from client");
                      this.setState(RPCstate.FACK_SENT, 1);
                      return this.pktr.sendCommand(Command.FACK, "", sub_port, this.inboundSeqNo);
                    }
                  }
                }
              }
            }
          } else if (command === Command.PING) {
            this.log.debug("Received PING, sending PACK");
            return this.pktr.sendCommand(Command.PACK, "", sub_port, seq_no);
          } else if (sub_port === this.outboundSubPort) {
            if (seq_no === this.outboundSeqNo || seq_no === this.outboundSeqNo + 1) {
              this.log.debug("Sequence number is correct");
              switch (command) {
                case Command.CACK:
                  if (this.state === RPCState.CONNECT_SENT) {
                    this.log.debug("CONNECT acknowledged");
                    this.setState(RPCState.IDLE, 1);
                    this.emit('connected');
                    return this.connected = true;
                  }
                  break;
                case Command.QACK:
                  if (this.state === RPCState.QUERY_SENT && seq_no === this.outboundSeqNo) {
                    this.log.debug("QUERY acknowledged");
                    return this.setState(RPCState.AWAITING_RESPONSE, 1);
                  }
                  break;
                case Command.RESPONSE:
                  if ((this.state === RPCState.AWAITING_RESPONSE) || (this.state === RPCState.QUERY_SENT) && (seq_no === outboundSeqNo)) {
                    this.setState(RPCState.IDLE, 1);
                    this.emit('message', hwdbparser.parseQueryOrResponse(data));
                    this.pktr.sendCommand(Command.RACK, "", this.outboundSubPort, this.outboundSeqNo);
                    this.log.debug("RESPONSE received: " + data);
                    return this.setState(RPCState.IDLE, 1);
                  }
                  break;
                case Command.SACK:
                  if (this.state === RPCState.SEQNO_SENT) {
                    this.log.debug("SEQNO acknowledged");
                    this.setState(RPCState.IDLE, 1);
                    return this.emit('SACK');
                  }
                  break;
                case Command.DACK:
                  if (this.state === RPCState.DISCONNECT_SENT) {
                    this.log.debug("DISCONNECT acknowledged");
                    this.pktr.close();
                    return this.emit('disconnected');
                  }
                  break;
                case Command.PACK:
                  this.clearIdleTimer(1);
                  this.log.debug("PING acknowledged");
                  return this.setState(RPCState.IDLE, 1);
              }
            }
          } else if (sub_port === this.inboundSubPort || this.inboundSubPort === 0) {
            if (this.inboundSubPort === 0) {
              this.inboundSubPort = sub_port;
              this.inboundSeqNo = seq_no;
            }
            if (command === Command.SEQNO) {
              this.log.debug("Server requesting SEQNO reset");
              if (this.state === RPCState.RESPONSE_SENT) {
                this.log.debug("Server didn't get our RACK, ignoring");
                this.setState(RPCState.IDLE, 0);
              }
              if (this.state === RPCState.IDLE) {
                this.log.debug("SACK sent");
                this.inboundSeqNo = seq_no;
                this.pktr.sendCommand(Command.SACK, "", sub_port, this.inboundSeqNo);
              }
            }
            if (seq_no === this.inboundSeqNo || seq_no === this.inboundSeqNo + 1) {
              switch (command) {
                case Command.CONNECT:
                  this.log.debug("Received CONNECT");
                  this.pktr.sendCommand(Command.CACK, "", this.inboundSubPort, this.inboundSeqNo);
                  return this.setState(RPCState.IDLE, 0);
                case Command.QUERY:
                  this.log.debug("Received QUERY: " + data);
                  this.emit('message', hwdbparser.parseQueryOrResponse(data));
                  this.pktr.sendCommand(Command.QACK, "", this.inboundSubPort, ++this.inboundSeqNo);
                  this.setState(RPCState.QACK_SENT, 0);
                  this.pktr.sendCommand(Command.RESPONSE, "OK\0", this.inboundSubPort, this.inboundSeqNo);
                  return this.setState(RPCState.RESPONSE_SENT, 0);
                case Command.RACK:
                  if (this.state === RPCState.RESPONSE_SENT && seq_no === this.inboundSeqNo) {
                    this.log.debug("Received RACK");
                    return this.setState(RPCState.IDLE, 0);
                  }
                  break;
                case Command.DISCONNECT:
                  this.log.debug("Server requested disconnect, sending DACK");
                  this.pktr.sendCommand(Command.DACK, "", this.inboundSubPort, this.inboundSeqNo);
                  return this.setState(RPCState.TIMEDOUT, 0);
                case Command.PACK:
                  this.clearIdleTimer(0);
                  this.log.debug("Received PACK");
                  return this.setState(RPCState.IDLE, 0);
              }
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
      return this.state;
    };
    JSRPC.prototype.setState = function(new_state, direction) {
      this.state = new_state;
      this.log.debug("New state: " + this.state);
      if (this.state === RPCState.IDLE) {
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
        this.pktr.close();
        return this.emit('timedout');
      } else if (direction === 0) {
        clearTimeout(this.idleInboundTimer);
        this.log.debug("Setting new PING timer for inbound with" + ticks + "ticks");
        return this.idleInboundTimer = setTimeout(__bind(function() {
          this.log.debug("Timer executed, sending PING on inbound and setting with " + ticks - 1 + " ticks");
          this.pktr.sendCommand(Command.PING, "", this.inboundSubPort, this.inboundSeqNo);
          return this.setIdleTimer(direction, ticks - 1);
        }, this), this.pingInterval * 1000);
      } else if (direction === 1) {
        clearTimeout(this.idleOutboundTimer);
        this.log.debug("Setting new PING timer for outbound" + ticks + "ticks");
        return this.idleOutboundTimer = setTimeout(__bind(function() {
          this.log.debug("Timer executed, sending PING on outbound and setting timer with " + ticks - 1 + " ticks");
          this.pktr.sendCommand(Command.PING, "", this.outboundSubPort, this.outboundSeqNo);
          return this.setIdleTimer(direction, ticks - 1);
        }, this), this.pingInterval * 1000);
      }
    };
    JSRPC.prototype.clearIdleTimer = function(direction) {
      if (direction === 0) {
        this.log.debug("Clearing inbound timer");
        clearTimeout(this.idleInboundTimer);
        return this.idleInboundTimer = 0;
      } else if (direction === 1) {
        this.log.debug("Clearing outbound timer");
        clearTimeout(this.idleOutboundTimer);
        return this.idleOutboundTimer = 0;
      }
    };
    JSRPC.prototype.connect = function() {
      this.setupCommandListener();
      this.setState(RPCState.CONNECT_SENT);
      this.pktr.sendCommand(Command.CONNECT, "HWDB\0", this.outboundSubPort, this.outboundSeqNo);
      this.lport = this.pktr.listen();
      return setTimeout(__bind(function() {
        return this.pktr.sendCommand(Command.CONNECT, "HWDB\0", this.outboundSubPort, this.outboundSeqNo);
      }, this), 2000);
    };
    JSRPC.prototype.query = function(query) {
      var query_header;
      if (query.indexOf("subscribe") !== -1) {
        query += this.lport + " Handler\0";
      } else {
        query += "\0";
      }
      query_header = String.fromCharCode(0) + String.fromCharCode(query.length);
      query_header += String.fromCharCode(0) + String.fromCharCode(query.length);
      query = query_header + query;
      if (this.connected) {
        this.log.debug("Sending query: " + query);
        if (this.outboundSeqNo >= 4294967294) {
          this.log.debug("SEQNO wrapping around");
          this.outboundSeqNo = 0;
          this.pktr.sendCommand(Command.SEQNO, "", this.outboundSubPort, this.outboundSeqNo);
          this.setState(RPCState.SEQNO_SENT);
          return this.once('SACK', function() {
            return this.pktr.sendCommand(Command.QUERY, query, this.outboundSubPort, ++this.outboundSeqNo);
          });
        } else {
          this.pktr.sendCommand(Command.QUERY, query, this.outboundSubPort, ++this.outboundSeqNo);
          return this.setState(RPCState.QUERY_SENT);
        }
      } else {
        this.log.debug("Not connected yet, queued query: " + query);
        return this.once('connected', function() {
          this.pktr.sendCommand(Command.QUERY, query, this.outboundSubPort, ++this.outboundSeqNo);
          return this.setState(RPCState.QUERY_SENT);
        });
      }
    };
    JSRPC.prototype.disconnect = function() {
      this.log.debug("Calling disconnect");
      this.pktr.sendCommand(Command.DISCONNECT, "", this.outboundSubPort, this.outboundSeqNo);
      return this.setState(RPCState.DISCONNECT_SENT);
    };
    return JSRPC;
  })();
  exports.jsrpc = JSRPC;
}).call(this);
