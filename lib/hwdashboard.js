(function() {
  var DASHBOARD_PORT, HWDashboardLogger, LOG_LEVEL, dashORM, dashboardModel, express, io_server, log, models, package_data, package_timeout, query_jsrpc, rest_server, sio_app, stream_jsrpc;
  LOG_LEVEL = 5;
  DASHBOARD_PORT = 80;
  dashORM = require('./dashorm').dashorm;
  dashORM.initialize();
  "aggregator = require('./aggregator').aggregator\naggregator.initialize()";
  HWDashboardLogger = require('./logger').logger;
  log = new HWDashboardLogger("hwdbdashboard", LOG_LEVEL);
  log.notice("Starting HWDashboard");
  stream_jsrpc = require('./jsrpc').jsrpc;
  query_jsrpc = require('./jsrpc').jsrpc;
  sio_app = require('socket.io');
  express = require('express');
  models = require('../public/scripts/models').models;
  rest_server = express.createServer();
  io_server = sio_app.listen(rest_server);
  rest_server.configure(function() {
    rest_server.use(express.static(__dirname + '/../public'));
    return rest_server.set('views', __dirname + '/../public/views');
  });
  dashboardModel = new models.DashboardModel();
  dashboardModel.populateTestData();
  io_server.sockets.on("connection", function(socket) {
    return socket.on("cli", function(d) {
      return socket.emit("updateView", dashboardModel.monthlyallowances.get("10-2011").xport());
    });
  });
  package_timeout = 0;
  package_data = [];
  "stream_jsrpc.connect()\nstream_jsrpc.query(\"SQL:subscribe BWUsageLast 127.0.0.1 \")\n\nstream_jsrpc.on('message', (msg) ->\n  if msg isnt \"Success\"\n    package_data.push pkg for pkg in msg\n    if package_timeout then clearTimeout(package_timeout)\n    package_timeout = setTimeout( ->\n      total = 0\n      total += parseInt(i.bytes) for i in package_data\n      current_date = new Date()\n      date_query = current_date.getFullYear() + \"/\" + (parseInt(current_date.getMonth()+1))\n      household_current_month = dashboardModel.monthlyallowances.get(date_query).household\n      household_current_month.set({ usage : household_current_month.get(\"usage\") + total })\n      console.log household_current_month\n      \n      package_data.length = 0\n    , 3000)\n\n    console.log (\"Added to package\")\n)";
  stream_jsrpc.on('timedout', function() {
    log.error("JSRPC timed out, process exiting");
    return process.exit(1);
  });
  log.info("JSRPC setup executed");
  rest_server.get('/:base', function(req, res) {
    if (req.params.base.indexOf(".") === -1) {
      return res.render(req.params.base + '.ejs');
    }
  });
  rest_server.get('/:base/*?', function(req, res) {
    if (req.xhr) {
      return dashORM.query(req.params.base, req.params[0].split("/"), res);
    } else if (req.params.base.indexOf(".") === -1) {
      return res.render(req.params.base + '.ejs');
    }
  });
  if (!module.parent) {
    rest_server.listen(DASHBOARD_PORT, function() {
      var addr;
      return addr = rest_server.address();
    });
    log.notice("Dashboard server listening on port " + DASHBOARD_PORT);
    "process.on 'SIGINT', ->\n  stream_jsrpc.disconnect()\n  stream_jsrpc.on 'disconnected', ->\n    log.notice \"HWDashboard killed by SIGINT, exited gracefully\"\n    process.exit(0)\n  process.exit(0)";
  }
}).call(this);