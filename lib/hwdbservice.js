(function() {
  var events, express, io_server, pres_server, sockio, stats, stats_jsrpc;
  stats_jsrpc = require('./jsrpc').jsrpc;
  sockio = require('socket.io');
  express = require('express');
  pres_server = express.createServer();
  io_server = sockio.listen(pres_server);
  pres_server.configure(function() {
    pres_server.use(express.static(__dirname + '/../public'));
    pres_server.use(express.logger());
    return pres_server.use(express.bodyParser());
  });
  pres_server.get('/', function(req, res) {
    return res.sendfile('../public/index.html');
  });
  events = io_server.of('/events');
  stats = io_server.of('/stats');
  stats_jsrpc.on('message', function(data) {
    return stats.emit('network_stream', data);
  });
  if (!module.parent) {
    pres_server.listen(3010, function() {
      var addr;
      addr = pres_server.address();
      return console.log("Started presentation server");
    });
  }
}).call(this);
