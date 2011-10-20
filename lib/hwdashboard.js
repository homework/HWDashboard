(function() {
  var Aggregator, DASHBOARD_PORT, LOG_LEVEL;
  LOG_LEVEL = 5;
  DASHBOARD_PORT = 80;
  "dashORM = require('./dashorm').dashorm\ndashORM.initialize()";
  Aggregator = require('./aggregator').aggregator;
  this.aggregator = new Aggregator;
  process.on('SIGINT', function() {
    aggregator.destroy();
    return setTimeout(function() {
      return process.exit(0);
    }, 5000);
  });
  "HWDashboardLogger = require('./logger').logger\nlog = new HWDashboardLogger \"hwdbdashboard\", LOG_LEVEL\n\nlog.notice \"Starting HWDashboard\"\n\nstream_jsrpc  = require('./jsrpc').jsrpc\nquery_jsrpc   = require('./jsrpc').jsrpc\nsio_app       = require('socket.io')\nexpress       = require('express')\n\nmodels = require('../public/scripts/models').models\n\nrest_server = express.createServer()\nio_server = sio_app.listen(rest_server)\n\n\nrest_server.configure( ->\n  rest_server.use express.static(__dirname + '/../public')\n  #rest_server.use(express.bodyParser())\n  rest_server.set 'views', __dirname + '/../public/views'\n)\n\ndashboardModel = new models.DashboardModel()\ndashboardModel.populateTestData()\n \nio_server.sockets.on \"connection\", (socket) ->\n  \n  socket.join('allowances')\n  socket.on \"cli\", (d) ->\n    socket.emit \"updateView\", dashboardModel.monthlyallowances.get(\"10-2011\").xport()\n\n# === Live Data ===\npackage_timeout = 0\npackage_data = []\n\nstream_jsrpc.connect()\nstream_jsrpc.query(\"SQL:subscribe BWStatsLast 127.0.0.1 \")\n\nstream_jsrpc.on('message', (msg) ->\n  if msg isnt \"Success\"\n    package_data.push pkg for pkg in msg\n    if package_timeout then clearTimeout(package_timeout)\n    package_timeout = setTimeout( ->\n      io_server.sockets.in('allowances').emit 'updateView', dashORM.liveUpdate(package_data)\n      package_data.length = 0\n    , 3000)\n\n    console.log (\"Added to package\")\n)\n\nstream_jsrpc.on('timedout', ->\n  log.error \"JSRPC timed out, process exiting\"\n  process.exit(1)\n)\nlog.info \"JSRPC setup executed\"\n\nrest_server.get('/', (req,res) ->\n  res.redirect('/allowances')\n)\n\nrest_server.get('/:base', (req, res) ->\n  if req.params.base.indexOf(\".\") is -1\n    res.render(req.params.base+'.ejs')\n)\n\nrest_server.get('/:base/*?', (req, res) ->\n\n  if req.xhr\n    dashORM.query req.params.base, req.params[0].split(\"/\"), res\n  else if req.params.base.indexOf(\".\") is -1\n    res.render(req.params.base+'.ejs')\n)\n\nif !module.parent\n  rest_server.listen(DASHBOARD_PORT, ->\n    addr = rest_server.address()\n  )\n  log.notice \"Dashboard server listening on port \" + DASHBOARD_PORT\n  process.on 'SIGINT', ->\n    stream_jsrpc.disconnect()\n    stream_jsrpc.on 'disconnected', ->\n      log.notice \"HWDashboard killed by SIGINT, exited gracefully\"\n      process.exit(0)\n    process.exit(0)";
}).call(this);
