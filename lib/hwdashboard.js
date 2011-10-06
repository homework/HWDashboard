(function() {
  var DASHBOARD_PORT, HWDashboardLogger, LOG_LEVEL, express, io_server, log, models, now_app, query_jsrpc, rest_server, stream_jsrpc;
  LOG_LEVEL = 5;
  DASHBOARD_PORT = 80;
  "aggregator = require('./aggregator').aggregator\n\naggregator.initialize()";
  HWDashboardLogger = require('./logger').logger;
  log = new HWDashboardLogger("hwdbdashboard", LOG_LEVEL);
  log.notice("Starting HWDashboard");
  stream_jsrpc = require('./jsrpc').jsrpc;
  query_jsrpc = require('./jsrpc').jsrpc;
  now_app = require('now');
  express = require('express');
  models = require('../public/scripts/models').models;
  rest_server = express.createServer();
  io_server = now_app.initialize(rest_server);
  rest_server.configure(function() {
    rest_server.use(express.static(__dirname + '/../public'));
    rest_server.use(express.bodyParser());
    return rest_server.set('views', __dirname + '/../public/views');
  });
  io_server.now.serverOutput = function(data) {
    var dashboardModel;
    dashboardModel = new models.DashboardModel();
    dashboardModel.populateTestData();
    return io_server.now.updateView(dashboardModel.monthlyallowances.get("October-2011").xport());
  };
  "stream_jsrpc.connect()\nstream_jsrpc.query(\"SQL:subscribe BWUsageLast 127.0.0.1 \")\n\nstream_jsrpc.on('timedout', ->\n  log.error \"JSRPC timed out, process exiting\"\n  process.exit(1)\n)\nlog.info \"JSRPC setup executed\"\n\ndd = require('./dummydata').dummy_data\nstate_builder = require('./statebuilder').statebuilder\n\n# Update todays state from stream\nstream_jsrpc.on('message', (data) ->\n  if data is \"Success\"\n    console.log \"Connected\"\n  else\n    todays_state = state_builder.parseResult(data, todays_state)\n    console.log todays_state\n    io_server.now.updateView todays_state\n<F2>)\nio_server.now.queryMonths = (startYear, startMonth, endYear, endMonth) ->\n\n  #TO BE FIXED, TIMEZONE INVALID DUE TO DST\n  month_start = new Date(startYear, startMonth+1, 1)\n  month_end   = new Date(endYear, endMonth+1, 1)\n\n  ns = state_builder.parseResult(dd[0], 0, month_start, month_end)\n  io_server.now.updateView ns\n  \n  query_jsrpc.query(\"SQL:select * from BWUsage range (\" + month_start + \", \" + month_end + \")\") \n\n  query_jsrpc.on('message', (data) ->\n    io_server.now.updateView state_builder.parseResult(data, 0, month_start, month_end)\n  )";
  rest_server.get('/allowances', function(req, res) {
    return res.render('allowances.ejs');
  });
  if (!module.parent) {
    rest_server.listen(DASHBOARD_PORT, function() {
      var addr;
      return addr = rest_server.address();
    });
    log.notice("Dashboard server listening on port " + DASHBOARD_PORT);
  }
  "process.on 'SIGINT', ->\n  stats_jsrpc.disconnect()\n  stats_jsrpc.on 'disconnected', ->\n    log.notice \"HWDashboard killed by SIGINT, exited gracefully\"\n    process.exit(0)\n  process.exit(0)";
}).call(this);
