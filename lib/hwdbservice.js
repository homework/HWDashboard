(function() {
  var events, express, io_server, rest_server, sockio, stats, stats_jsrpc;
  stats_jsrpc = require('./jsrpc').jsrpc;
  sockio = require('socket.io');
  express = require('express');
  rest_server = express.createServer();
  io_server = sockio.listen(rest_server);
  rest_server.configure(function() {
    return rest_server.use(express.bodyParser());
  });
  events = io_server.of('/events');
  stats = io_server.of('/stats');
  stats_jsrpc.connect();
  stats_jsrpc.query("SQL:subscribe StatsLast 192.168.1.78 ");
  stats_jsrpc.on('message', function(data) {
    return stats.emit('network_stream', data);
  });
  rest_server.get('/', function(req, res) {
    return res.sendfile('public/index.html');
  });
  rest_server.post('/stats', function(req, res) {
    if ((req.body.bytes != null) && (req.body.packets != null)) {
      stats.emit('network_stream', req.body.bytes, req.body.packets);
      return res.json({
        result: true
      });
    } else {
      return res.json({
        result: false
      });
    }
  });
  if (!module.parent) {
    rest_server.listen(3010, function() {
      var addr;
      addr = rest_server.address();
      return console.log("Started Express server");
    });
  }
}).call(this);
