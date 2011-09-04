(function() {
  var EventEmitter, Packeteer;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  EventEmitter = require('events').EventEmitter;
  Packeteer = (function() {
    var connectAddress, connectPort, outbound_socket, udp;
    __extends(Packeteer, EventEmitter);
    function Packeteer() {
      Packeteer.__super__.constructor.apply(this, arguments);
    }
    udp = require('dgram');
    outbound_socket = udp.createSocket("udp4");
    connectAddress = '192.168.1.1';
    connectPort = 987;
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
    Packeteer.prototype.sendCommand = function(command, data, sub_port, seq_no) {
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
    Packeteer.prototype.close = function() {
      return outbound_socket.close();
    };
    return Packeteer;
  })();
  exports.packeteer = Packeteer;
}).call(this);
