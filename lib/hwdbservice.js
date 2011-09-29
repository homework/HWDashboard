(function() {
  var DASHBOARD_PORT, HWDashboardLogger, LOG_LEVEL, express, io_server, log, now_app, rest_server, state, stats_jsrpc;
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
  stats_jsrpc.query("SQL:subscribe BWUsageLast 192.168.1.78 ");
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
