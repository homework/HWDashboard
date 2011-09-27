(function() {
  var DASHBOARD_PORT, HWDashboardLogger, LOG_LEVEL, events, express, io_server, log, rest_server, sockio, stats, stats_jsrpc;
  LOG_LEVEL = 5;
  DASHBOARD_PORT = 3010;
  HWDashboardLogger = require('./logger').logger;
  log = new HWDashboardLogger("hwdbdashboard", LOG_LEVEL);
  log.notice("Starting HWDashboard");
  stats_jsrpc = require('./jsrpc').jsrpc;
  sockio = require('socket.io');
  express = require('express');
  rest_server = express.createServer();
  io_server = sockio.listen(rest_server);
  rest_server.configure(function() {
    rest_server.use(express.static(__dirname + '/../public'));
    return rest_server.use(express.bodyParser());
  });
  events = io_server.of('/events');
  stats = io_server.of('/stats');
  log.info("Socket.IO now listening on /events and /stats");
  stats_jsrpc.connect();
  stats_jsrpc.query("SQL:subscribe SysLast 192.168.1.78 ");
  stats_jsrpc.on('message', function(data) {
    return stats.emit('network_stream', data);
  });
  stats_jsrpc.on('timedout', function() {
    log.error("JSRPC timed out, process exiting");
    return process.exit(1);
  });
  log.info("JSRPC setup executed");
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
