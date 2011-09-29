(function() {
  var DASHBOARD_PORT, Defragger, EventEmitter, HWDBParser, HWDashboardLogger, JSRPC, LOG_LEVEL, Packeteer, express, hwdbparser, io_server, log, now_app, pktr, rest_server, state, stats_jsrpc;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  HWDashboardLogger = (function() {
    var Log, fs, path;
    Log = require('log');
    fs = require('fs');
    path = require('path');
    function HWDashboardLogger(classlog, loglevel) {
      var log;
      this.classlog = classlog;
      this.loglevel = loglevel;
      path.exists(__dirname + '/logs', function(exist) {
        if (!exist) {
          return fs.mkdir(__dirname + '/logs', '0755');
        }
      });
      return log = new Log(this.loglevel, fs.createWriteStream(__dirname + '/logs/' + this.classlog + '.log'));
    }
    return HWDashboardLogger;
  })();
  exports.logger = HWDashboardLogger;
  HWDBParser = (function() {
    function HWDBParser() {
      this.parseQueryOrResponse = __bind(this.parseQueryOrResponse, this);
    }
    HWDBParser.prototype.parseQueryOrResponse = function(data) {
      var column, column_count, columns, data_lines, fields, i, result, results, row, row_count, rows, _i, _j, _k, _len, _len2, _len3, _ref;
      data_lines = data.split('\n');
      result = data_lines[0].split('<|>');
      column_count = parseInt(result[2]);
      row_count = parseInt(result[3]);
      if (column_count >= 1 && row_count >= 1) {
        columns = (function() {
          var _i, _len, _ref, _results;
          _ref = (data_lines[1].split('<|>')).slice(0, -1);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            column = _ref[_i];
            _results.push((column.split(':'))[1]);
          }
          return _results;
        })();
        rows = [];
        _ref = data_lines.slice(2);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          if ((row != null) && row !== "") {
            fields = row.split('<|>').slice(0, -1);
            fields[0] = ((parseInt(fields[0].slice(1, -1), 16)).toString()).slice(0, 11);
            rows.push(fields);
          }
        }
        results = [];
        for (_j = 0, _len2 = rows.length; _j < _len2; _j++) {
          row = rows[_j];
          result = {};
          i = 0;
          for (_k = 0, _len3 = columns.length; _k < _len3; _k++) {
            column = columns[_k];
            result[column] = row[i++];
          }
          results.push(result);
        }
        return results;
      } else {
        return result[1];
      }
    };
    return HWDBParser;
  })();
  exports.hwdbparser = new HWDBParser;
  Defragger = (function() {
    var fragCount, fragNo, fullData, totalLength;
    fragCount = 0;
    fragNo = 0;
    totalLength = 0;
    fullData = "";
    function Defragger(frag_no, total_length) {
      fragNo = frag_no;
      totalLength = total_length;
      fragCount++;
    }
    Defragger.prototype.push = function(frag_count, data) {
      if (frag_count === fragCount + 1) {
        fullData += data;
        fragCount++;
      }
      return fragCount;
    };
    Defragger.prototype.getData = function() {
      return fullData;
    };
    return Defragger;
  })();
  exports.defragger = Defragger;
  EventEmitter = require('events').EventEmitter;
  HWDashboardLogger = require('./logger').logger;
  log = new HWDashboardLogger("packeteer", 5);
  Packeteer = (function() {
    var connectAddress, connectPort, inbound_socket, lport, outbound_socket, udp;
    __extends(Packeteer, EventEmitter);
    function Packeteer() {
      Packeteer.__super__.constructor.apply(this, arguments);
    }
    udp = require('dgram');
    inbound_socket = udp.createSocket("udp4");
    outbound_socket = udp.createSocket("udp4");
    connectAddress = '192.168.1.1';
    connectPort = 987;
    lport = 0;
    Packeteer.prototype.intToByteArray = function(number, width) {
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
    Packeteer.prototype.bufToInt = function(buf, width) {
      var byteString, hex_char, x, _ref, _ref2;
      byteString = "";
      for (x = 0, _ref = width - buf.length; 0 <= _ref ? x < _ref : x > _ref; 0 <= _ref ? x++ : x--) {
        byteString += "00";
      }
      for (x = 0, _ref2 = buf.length; 0 <= _ref2 ? x < _ref2 : x > _ref2; 0 <= _ref2 ? x++ : x--) {
        hex_char = buf[x].toString(16);
        if (hex_char.length === 1) {
          byteString += "0";
        }
        byteString += hex_char;
      }
      return parseInt(byteString, 16);
    };
    Packeteer.prototype.sendCommand = function(command, data, sub_port, seq_no, frag_count, frag_no) {
      var byteArray, i, prepped_data, _ref;
      if (frag_count == null) {
        frag_count = 1;
      }
      if (frag_no == null) {
        frag_no = 1;
      }
      byteArray = [];
      byteArray = byteArray.concat(this.intToByteArray(sub_port, 4));
      byteArray = byteArray.concat(this.intToByteArray(seq_no, 4));
      byteArray = byteArray.concat(this.intToByteArray(command, 2));
      byteArray.push(frag_count);
      byteArray.push(frag_no);
      for (i = 0, _ref = data.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        byteArray.push(data.charCodeAt(i));
      }
      log.debug("Sending " + command);
      prepped_data = new Buffer(byteArray);
      return outbound_socket.send(prepped_data, 0, prepped_data.length, connectPort, connectAddress);
    };
    Packeteer.prototype.listen = function() {
      inbound_socket.on("message", __bind(function(msg) {
        var command, data, frag_count, frag_no, seq_no, sub_port;
        sub_port = this.bufToInt(msg.slice(0, 4), 4);
        seq_no = this.bufToInt(msg.slice(4, 8), 4);
        command = this.bufToInt(msg.slice(8, 10), 2);
        frag_count = this.bufToInt(msg.slice(10, 11), 1);
        frag_no = this.bufToInt(msg.slice(11, 12), 1);
        data = msg.slice(12);
        log.debug("Receiving " + command);
        return this.emit("command", sub_port, seq_no, command, data, frag_count, frag_no);
      }, this));
      inbound_socket.bind(outbound_socket.address().port);
      return inbound_socket.address().port;
    };
    Packeteer.prototype.close = function() {
      inbound_socket.close();
      return outbound_socket.close();
    };
    return Packeteer;
  })();
  exports.packeteer = new Packeteer;
  EventEmitter = require('events').EventEmitter;
  pktr = require('./packeteer').packeteer;
  hwdbparser = require('./hwdbparser').hwdbparser;
  Defragger = require('./defragger').defragger;
  HWDashboardLogger = require('./logger').logger;
  log = new HWDashboardLogger("jsrpc", 7);
  JSRPC = (function() {
    var Command, RPCState, connected, defrag, idleInboundTimer, idleOutboundTimer, inboundSeqNo, inboundSubPort, lport, outboundSeqNo, outboundSubPort, pingInterval, state;
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
    defrag = 0;
    pingInterval = 15;
    JSRPC.prototype.setupCommandListener = function() {
      return pktr.on("command", __bind(function(sub_port, seq_no, command, data, frag_count, frag_no) {
        var fragment_length, total_length;
        if (frag_count === frag_no && frag_count !== 1) {
          defrag.push(frag_count, (data.toString()).slice(4));
          pktr.emit("command", sub_port, seq_no, command, defrag.getData(), 1, 1);
          defrag = 0;
        }
        if (command !== Command.FRAGMENT) {
          data = data.toString();
        }
        log.debug("Command: " + command + ", " + frag_count + ", " + frag_no);
        if (command === Command.FRAGMENT) {
          if (sub_port === outboundSubPort) {
            if (seq_no === outboundSeqNo || seq_no === outboundSeqNo + 1) {
              log.debug("Fragment sequence number is correct");
              total_length = pktr.bufToInt(new Buffer(data.slice(0, 2)), 2);
              fragment_length = pktr.bufToInt(new Buffer(data.slice(2, 4)), 2);
              log.debug("Fragment number: " + frag_count + "/" + frag_no);
              if (state === RPCState.AWAITING_RESPONSE) {
                if (seq_no === outboundSeqNo && frag_count === 1) {
                  defrag = new Defragger(frag_no, total_length);
                  defrag.push(frag_count, (data.toString()).slice(4));
                  log.debug("Pushed first fragment into Defragger from server");
                  this.setState(RPCState.FACK_SENT, 1);
                  return pktr.sendCommand(Command.FACK, "", sub_port, outboundSeqNo, frag_count, frag_no);
                }
              } else if (state === RPCState.FACK_SENT) {
                if (seq_no === outboundSeqNo && defrag) {
                  if ((defrag.push(frag_count, (data.toString()).slice(4))) === frag_count) {
                    log.debug("Pushed new fragment into Defragger from server");
                    this.setState(RPCState.FACK_SENT, 1);
                    return pktr.sendCommand(Command.FACK, "", sub_port, outboundSeqNo, frag_count, frag_no);
                  }
                }
              }
            }
          } else if (sub_port === inboundSubPort) {
            if (seq_no === inboundSeqNo || seq_no === inboundSeqNo + 1) {
              log.debug("Fragment sequence number is correct");
              fragment_length = data.slice(0, 1);
              total_length = data.slice(1, 2);
              log.debug("Fragment number:" + frag_count + "/" + frag_no);
              if (state === RPCState.RESPONSE_SENT && seq_no === (inboundSeqNo + 1) && frag_no === 1) {
                this.setState(RPCState.IDLE, 0);
              }
              if (state === RPCState.IDLE) {
                defrag = new Defragger(frag_count, total_length);
                defrag.push(frag_count, (data.toString()).slice(4));
                log.debug("Pushed first fragment into Defragger from client");
                this.setState(RPCState.FACK_SENT, 0);
                return pktr.sendCommand(Command.FACK, "", sub_port, ++inboundSeqNo);
              } else if (state === RPCState.FACK_SENT) {
                if (seq_no === inboundSeqNo && defrag) {
                  if ((defrag.push(frag_no, data.slice(4))) === frag_count) {
                    log.debug("Pushed new fragment into Defragger from client");
                    this.setState(RPCstate.FACK_SENT, 1);
                    return pktr.sendCommand(Command.FACK, "", sub_port, inboundSeqNo);
                  }
                }
              }
            }
          }
        } else if (command === Command.PING) {
          log.debug("Received PING, sending PACK");
          return pktr.sendCommand(Command.PACK, "", sub_port, seq_no);
        } else if (sub_port === outboundSubPort) {
          if (seq_no === outboundSeqNo || seq_no === outboundSeqNo + 1) {
            log.debug("Sequence number is correct");
            switch (command) {
              case Command.CACK:
                if (state === RPCState.CONNECT_SENT) {
                  log.debug("CONNECT acknowledged");
                  this.setState(RPCState.IDLE, 1);
                  this.emit('connected');
                  return connected = true;
                }
                break;
              case Command.QACK:
                if (state === RPCState.QUERY_SENT && seq_no === outboundSeqNo) {
                  log.debug("QUERY acknowledged");
                  return this.setState(RPCState.AWAITING_RESPONSE, 1);
                }
                break;
              case Command.RESPONSE:
                if ((state === RPCState.AWAITING_RESPONSE || RPCState.QUERY_SENT) && seq_no === outboundSeqNo) {
                  this.setState(RPCState.IDLE, 1);
                  this.emit('message', hwdbparser.parseQueryOrResponse(data.slice(4)));
                  pktr.sendCommand(Command.RACK, "", outboundSubPort, outboundSeqNo);
                  log.debug("RESPONSE received:", data.slice(4));
                  return this.setState(RPCState.IDLE, 1);
                }
                break;
              case Command.SACK:
                if (state === RPCState.SEQNO_SENT) {
                  log.debug("SEQNO acknowledged");
                  this.setState(RPCState.IDLE, 1);
                  return this.emit('SACK');
                }
                break;
              case Command.DACK:
                if (state === RPCState.DISCONNECT_SENT) {
                  log.debug("DISCONNECT acknowledged");
                  pktr.close();
                  return this.emit('disconnected');
                }
                break;
              case Command.PACK:
                this.clearIdleTimer(1);
                log.debug("PING acknowledged");
                return this.setState(RPCState.IDLE, 1);
            }
          }
        } else if (sub_port === inboundSubPort || inboundSubPort === 0) {
          if (inboundSubPort === 0) {
            inboundSubPort = sub_port;
            inboundSeqNo = seq_no;
          }
          if (command === Command.SEQNO) {
            log.debug("Server requesting SEQNO reset");
            if (state === RPCState.RESPONSE_SENT) {
              log.debug("Server didn't get our RACK, ignoring");
              this.setState(RPCState.IDLE, 0);
            }
            if (state === RPCState.IDLE) {
              log.debug("SACK sent");
              inboundSeqNo = seq_no;
              pktr.sendCommand(Command.SACK, "", sub_port, inboundSeqNo);
            }
          }
          if (seq_no === inboundSeqNo || seq_no === inboundSeqNo + 1) {
            switch (command) {
              case Command.CONNECT:
                log.debug("Received CONNECT");
                pktr.sendCommand(Command.CACK, "", inboundSubPort, inboundSeqNo);
                return this.setState(RPCState.IDLE, 0);
              case Command.QUERY:
                log.debug("Received QUERY: " + data.slice(4));
                this.emit('message', hwdbparser.parseQueryOrResponse(data.slice(4)));
                pktr.sendCommand(Command.QACK, "", inboundSubPort, ++inboundSeqNo);
                this.setState(RPCState.QACK_SENT, 0);
                pktr.sendCommand(Command.RESPONSE, "OK\0", inboundSubPort, inboundSeqNo);
                return this.setState(RPCState.RESPONSE_SENT, 0);
              case Command.RACK:
                if (state === RPCState.RESPONSE_SENT && seq_no === inboundSeqNo) {
                  log.debug("Received RACK");
                  return this.setState(RPCState.IDLE, 0);
                }
                break;
              case Command.DISCONNECT:
                log.debug("Server requested disconnect, sending DACK");
                pktr.sendCommand(Command.DACK, "", inboundSubPort, inboundSeqNo);
                return this.setState(RPCState.TIMEDOUT, 0);
              case Command.PACK:
                this.clearIdleTimer(0);
                log.debug("Received PACK");
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
      log.debug("New state: " + state);
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
        log.debug("Setting new PING timer for inbound");
        return idleInboundTimer = setTimeout(__bind(function() {
          log.debug("Timer executed, sending PING on inbound and setting with " + ticks - 1 + " ticks");
          pktr.sendCommand(Command.PING, "", inboundSubPort, inboundSeqNo);
          return this.setIdleTimer(direction, ticks - 1);
        }, this), pingInterval * 1000);
      } else if (direction === 1) {
        clearTimeout(idleOutboundTimer);
        log.debug("Setting new PING timer for outbound");
        return idleOutboundTimer = setTimeout(__bind(function() {
          log.debug("Timer executed, sending PING on outbound and setting timer with " + ticks - 1 + " ticks");
          pktr.sendCommand(Command.PING, "", outboundSubPort, outboundSeqNo);
          return this.setIdleTimer(direction, ticks - 1);
        }, this), pingInterval * 1000);
      }
    };
    JSRPC.prototype.clearIdleTimer = function(direction) {
      if (direction === 0) {
        log.debug("Clearing inbound timer");
        clearTimeout(idleInboundTimer);
        return idleInboundTimer = 0;
      } else if (direction === 1) {
        log.debug("Clearing outbound timer");
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
        log.debug("Sending query: " + query);
        if (outboundSeqNo >= 4294967294) {
          log.debug("SEQNO wrapping around");
          outboundSeqNo = 0;
          pktr.sendCommand(Command.SEQNO, "", outboundSubPort, outboundSeqNo);
          this.setState(RPCState.SEQNO_SENT);
          return this.once('SACK', function() {
            return pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo);
          });
        } else {
          pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo);
          return this.setState(RPCState.QUERY_SENT);
        }
      } else {
        log.debug("Not connected yet, queued query: " + query);
        return this.once('connected', function() {
          pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo);
          return this.setState(RPCState.QUERY_SENT);
        });
      }
    };
    JSRPC.prototype.disconnect = function() {
      log.debug("Calling disconnect");
      pktr.sendCommand(Command.DISCONNECT, "", outboundSubPort, outboundSeqNo);
      return this.setState(RPCState.DISCONNECT_SENT);
    };
    return JSRPC;
  })();
  exports.jsrpc = new JSRPC;
  LOG_LEVEL = 5;
  DASHBOARD_PORT = 8002;
  state = {
    household: {
      usage: 101010100,
      allowance: 10000000000
    },
    users: [
      {
        id: 5,
        name: "Mum Smith",
        usage: 3012312000,
        allowance: 50000000000
      }, {
        id: 7,
        name: "Dad Smith",
        usage: 4012312000,
        allowance: 100000000000
      }
    ],
    devices: [
      {
        id: 1,
        name: "mac",
        usage: 4012312000,
        allowance: 10000000000
      }, {
        id: 4,
        name: "nbk",
        usage: 4012312000,
        allowance: 112000000000
      }
    ]
  };
  HWDashboardLogger = require('./logger').logger;
  log = new HWDashboardLogger("hwdbdashboard", LOG_LEVEL);
  log.notice("Starting HWDashboard");
  stats_jsrpc = require('./jsrpc').jsrpc;
  now_app = require('now');
  express = require('express');
  rest_server = express.createServer();
  io_server = now_app.initialize(rest_server);
  rest_server.configure(function() {
    rest_server.use(express.static(__dirname + '/../public'));
    return rest_server.use(express.bodyParser());
  });
  io_server.now.serverOutput = function(data) {
    console.log(data);
    return io_server.now.bandwidthUpdate(state);
  };
  stats_jsrpc.connect();
  stats_jsrpc.query("SQL:subscribe SysLast 192.168.1.78 ");
  stats_jsrpc.on('message', function(data) {
    return console.log(data);
  });
  stats_jsrpc.on('timedout', function() {
    log.error("JSRPC timed out, process exiting");
    return process.exit(1);
  });
  log.info("JSRPC setup executed");
  rest_server.get('/*', function(req, res) {
    return res.sendfile('../public/index.html', function(err) {
      return console.log(err);
    });
  });
  if (!module.parent) {
    rest_server.listen(DASHBOARD_PORT, function() {
      var addr;
      return addr = rest_server.address();
    });
    log.notice("Dashboard server listening on port " + DASHBOARD_PORT);
    process.on('SIGINT', function() {
      stats_jsrpc.disconnect();
      return stats_jsrpc.on('disconnected', function() {
        log.notice("HWDashboard killed by SIGINT, exited gracefully");
        return process.exit(0);
      });
    });
  }
}).call(this);
