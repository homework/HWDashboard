(function() {
  var DASHBOARD_PORT, HWDashboardLogger, LOG_LEVEL, dd, express, io_server, log, now_app, query_jsrpc, rest_server, state_builder, stream_jsrpc, todays_state;
  LOG_LEVEL = 5;
  DASHBOARD_PORT = 80;
  HWDashboardLogger = require('./logger').logger;
  log = new HWDashboardLogger("hwdbdashboard", LOG_LEVEL);
  log.notice("Starting HWDashboard");
  stream_jsrpc = require('./jsrpc').jsrpc;
  query_jsrpc = require('./jsrpc').jsrpc;
  now_app = require('now');
  express = require('express');
  rest_server = express.createServer();
  io_server = now_app.initialize(rest_server);
  rest_server.configure(function() {
    rest_server.use(express.static(__dirname + '/../public'));
    return rest_server.use(express.bodyParser());
  });
  io_server.now.serverOutput = function(data) {
    return console.log(data);
  };
  "stream_jsrpc.connect()\nstream_jsrpc.query(\"SQL:select * from BWUsage \")\nquery_jsrpc.connect()";
  stream_jsrpc.on('timedout', function() {
    log.error("JSRPC timed out, process exiting");
    return process.exit(1);
  });
  log.info("JSRPC setup executed");
  dd = require('./dummydata').dummy_data;
  state_builder = require('./statebuilder').statebuilder;
  todays_state = {
    household: {
      usage: 0,
      allowance: 900000000000
    }
  };
  "# Update todays state from stream\nstream_jsrpc.on('message', (data) ->\n  todays_state = state_builder.parseResult(data, todays_state)\n  io_server.now.updateView todays_state\n)";
  io_server.now.queryMonths = function(startYear, startMonth, endYear, endMonth) {
    var month_end, month_start, ns;
    month_start = new Date(startYear, startMonth + 1, 1);
    month_end = new Date(endYear, endMonth + 1, 1);
    ns = state_builder.parseResult(dd[0], 0, month_start, month_end);
    io_server.now.updateView(ns);
    return "query_jsrpc.query(\"SQL:select * from BWUsage range (\" + month_start + \", \" + month_end + \")\") \n\nquery_jsrpc.on('message', (data) ->\n  io_server.now.updateView state_builder.parseResult(data, 0, month_start, month_end)\n)";
  };
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
      "stats_jsrpc.disconnect()\nstats_jsrpc.on 'disconnected', ->\n  log.notice \"HWDashboard killed by SIGINT, exited gracefully\"\n  process.exit(0)";      return process.exit(0);
    });
  }
}).call(this);
