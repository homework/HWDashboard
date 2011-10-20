(function() {
  var EventEmitter, HWDashboardLogger, Packeteer;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  EventEmitter = require('events').EventEmitter;
  HWDashboardLogger = require('./logger').logger;
  Packeteer = (function() {
    var udp;
    __extends(Packeteer, EventEmitter);
    udp = require('dgram');
    function Packeteer(address, port) {
      if (address == null) {
        address = '127.0.0.1';
      }
      if (port == null) {
        port = 987;
      }
      this.log = new HWDashboardLogger("packeteer", 5);
      this.inbound_socket = udp.createSocket("udp4");
      this.outbound_socket = udp.createSocket("udp4");
      this.connectAddress = address;
      this.connectPort = port;
      this.lport = 0;
    }
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
      if (command === 5) {
        byteArray.push(String.fromCharCode(0) + String.fromCharCode(data.length));
        byteArray.push(String.fromCharCode(0) + String.fromCharCode(data.length));
      }
      for (i = 0, _ref = data.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        byteArray.push(data.charCodeAt(i));
      }
      this.log.debug("Sending " + command);
      prepped_data = new Buffer(byteArray);
      return this.outbound_socket.send(prepped_data, 0, prepped_data.length, this.connectPort, this.connectAddress);
    };
    Packeteer.prototype.listen = function() {
      this.inbound_socket.on("message", __bind(function(msg) {
        var command, data, frag_count, frag_no, seq_no, sub_port;
        sub_port = this.bufToInt(msg.slice(0, 4), 4);
        seq_no = this.bufToInt(msg.slice(4, 8), 4);
        command = this.bufToInt(msg.slice(8, 10), 2);
        frag_count = this.bufToInt(msg.slice(10, 11), 1);
        frag_no = this.bufToInt(msg.slice(11, 12), 1);
        data = msg.slice(12);
        this.log.debug("Receiving " + command);
        return this.emit("command", sub_port, seq_no, command, data, frag_count, frag_no);
      }, this));
      console.log(this.connectAddress, this.connectPort);
      console.log("binding on " + this.outbound_socket.address() + ":" + this.outbound_socket.address().port);
      this.inbound_socket.bind(this.outbound_socket.address().port);
      return this.inbound_socket.address().port;
    };
    Packeteer.prototype.close = function() {
      this.inbound_socket.close();
      return this.outbound_socket.close();
    };
    return Packeteer;
  })();
  exports.packeteer = Packeteer;
}).call(this);
