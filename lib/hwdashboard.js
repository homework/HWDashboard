(function() {
  var DASHBOARD_PORT, DashORM, HWDashboardLogger, JsRPC, LOG_LEVEL, StreamProxy, client_stream, dashORM, express, hwdb_query, hwdb_stream, log, models, package_data, package_timeout, path, rest_server;
  LOG_LEVEL = 5;
  DASHBOARD_PORT = 80;
  express = require('express');
  path = require('path');
  DashORM = require('./dashorm').dashorm;
  HWDashboardLogger = require('./logger').logger;
  JsRPC = require('./jsrpc').jsrpc;
  StreamProxy = require('./streamproxy').streamproxy;
  models = require('../public/scripts/models').models;
  log = new HWDashboardLogger("hwdbdashboard", LOG_LEVEL);
  hwdb_stream = new JsRPC;
  hwdb_query = new JsRPC;
  "Aggregator = require('./aggregator').aggregator\n@aggregator = new Aggregator";
  log.notice("Starting HWDashboard");
  rest_server = express.createServer();
  client_stream = new StreamProxy(rest_server);
  rest_server.configure(function() {
    rest_server.use(express.static(__dirname + '/../public'));
    return rest_server.set('views', __dirname + '/../public/views');
  });
  dashORM = new DashORM;
  package_timeout = 0;
  package_data = [];
  hwdb_stream.connect();
  hwdb_stream.query("SQL:subscribe BWStatsLast 127.0.0.1 ");
  hwdb_stream.on('message', function(msg) {
    var pkg, _i, _len, _ref;
    if (msg[0].rows !== 0) {
      _ref = msg.slice(1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pkg = _ref[_i];
        package_data.push(pkg);
      }
      if (package_timeout) {
        clearTimeout(package_timeout);
      }
      package_timeout = setTimeout(function() {
        dashORM.liveUpdate(package_data);
        return package_data.length = 0;
      }, 3000);
      return console.log("Added to package");
    }
  });
  hwdb_stream.on('timedout', function() {
    log.error("JsRPC timed out, process exiting");
    return process.exit(1);
  });
  log.info("JsRPC setup executed");
  rest_server.get('/', function(req, res) {
    return res.redirect('/allowances');
  });
  rest_server.get('/:base', function(req, res) {
    return path.exists('./public/views/' + req.params.base + '.ejs', function(exists) {
      if (req.params.base.indexOf(".") === -1 && exists) {
        return res.render(req.params.base + '.ejs');
      }
    });
  });
  rest_server.get('/:base/*?', function(req, res) {
    if (req.xhr) {
      return dashORM.query(req.params.base, req.params[0].split("/"), res);
    } else if (req.params.base.indexOf(".") === -1) {
      return path.exists('./public/views/' + req.params.base + '.ejs', function(exists) {
        if (req.params.base.indexOf(".") === -1 && exists) {
          return res.render(req.params.base + '.ejs');
        }
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
      hwdb_stream.disconnect();
      hwdb_stream.on('disconnected', function() {
        log.notice("HWDashboard killed by SIGINT, exited gracefully");
        return process.exit(0);
      });
      return process.exit(0);
    });
  }
}).call(this);
