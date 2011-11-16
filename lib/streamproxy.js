(function() {
  var EventEmitter, StreamProxy, io;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  EventEmitter = require('events').EventEmitter;
  io = require('socket.io');
  StreamProxy = (function() {
    __extends(StreamProxy, EventEmitter);
    StreamProxy.prototype.socketIO = 0;
    function StreamProxy(http_server) {
      if (http_server) {
        StreamProxy.prototype.socketIO = io.listen(http_server);
        StreamProxy.prototype.socketIO.sockets.on("connection", function(socket) {
          socket.on("joinRoom", __bind(function(model) {
            return socket.join(model);
          }, this));
          return socket.on("updateModel", function(model) {
            return this.emit("message", model);
          });
        });
      }
    }
    StreamProxy.prototype.push = function(room, command, model) {
      return StreamProxy.prototype.socketIO.sockets["in"](room).emit(command, model);
    };
    return StreamProxy;
  })();
  exports.streamproxy = StreamProxy;
}).call(this);
