(function() {
  var DASHBOARD_PORT, DashORM, HWDashboardLogger, JSRPC, LOG_LEVEL, dashORM, express, hwdb_query, hwdb_stream, io_server, log, models, package_data, package_timeout, path, rest_server, sio_app;
  LOG_LEVEL = 5;
  DASHBOARD_PORT = 80;
  sio_app = require('socket.io');
  express = require('express');
  path = require('path');
  DashORM = require('./dashorm').dashorm;
  HWDashboardLogger = require('./logger').logger;
  JSRPC = require('./jsrpc').jsrpc;
  models = require('../public/scripts/models').models;
  dashORM = new DashORM;
  log = new HWDashboardLogger("hwdbdashboard", LOG_LEVEL);
  hwdb_stream = new JSRPC;
  hwdb_query = new JSRPC;
  "Aggregator = require('./aggregator').aggregator\n@aggregator = new Aggregator";
  log.notice("Starting HWDashboard");
  rest_server = express.createServer();
  io_server = sio_app.listen(rest_server);
  rest_server.configure(function() {
    rest_server.use(express.static(__dirname + '/../public'));
    return rest_server.set('views', __dirname + '/../public/views');
  });
  io_server.sockets.on("connection", function(socket) {
    socket.join('allowances');
    return socket.on("cli", function(d) {
      return socket.emit("updateView", dashORM.query("allowances", "10-2011"));
    });
  });
  package_timeout = 0;
  package_data = [];
  hwdb_stream.connect();
  hwdb_stream.query("SQL:subscribe BWStatsLast 127.0.0.1 ");
  hwdb_stream.on('message', function(msg) {
    var pkg, _i, _len;
    if (msg[0].rows !== 0) {
      for (_i = 0, _len = msg.length; _i < _len; _i++) {
        pkg = msg[_i];
        package_data.push(pkg);
      }
      if (package_timeout) {
        clearTimeout(package_timeout);
      }
      package_timeout = setTimeout(function() {
        io_server.sockets["in"]('allowances').emit('updateView', dashORM.liveUpdate(package_data));
        return package_data.length = 0;
      }, 3000);
      return console.log("Added to package");
    }
  });
  hwdb_stream.on('timedout', function() {
    log.error("JSRPC timed out, process exiting");
    return process.exit(1);
  });
  log.info("JSRPC setup executed");
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
