# Stream proxy to enable Socket.IO streams to be easily accessible from
# utilizing a STATIC class (saves passing around an instantiation)

EventEmitter = require('events').EventEmitter

io = require('socket.io')

class StreamProxy extends EventEmitter

  socketIO: 0

  constructor: (http_server) ->

    if http_server

      StreamProxy::socketIO = io.listen http_server

      StreamProxy::socketIO.sockets.on "connection", (socket) ->

        socket.on "joinRoom", (model) =>
          socket.join model

        socket.on "updateModel", (model) ->
          @emit "message", model

  push: (room, command, model) ->

    if StreamProxy::socketIO
      StreamProxy::socketIO.sockets.in(room).emit command, model

exports.streamproxy = StreamProxy
