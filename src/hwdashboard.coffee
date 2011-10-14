LOG_LEVEL       = 5 # Log.NOTICE
DASHBOARD_PORT  = 80

"""
dashORM = require('./dashorm').dashorm
dashORM.initialize()
"""
aggregator = require('./aggregator').aggregator
aggregator.initialize()
"""
HWDashboardLogger = require('./logger').logger
log = new HWDashboardLogger "hwdbdashboard", LOG_LEVEL

log.notice "Starting HWDashboard"

stream_jsrpc  = require('./jsrpc').jsrpc
query_jsrpc   = require('./jsrpc').jsrpc
sio_app       = require('socket.io')
express       = require('express')

models = require('../public/scripts/models').models

rest_server = express.createServer()
io_server = sio_app.listen(rest_server)


rest_server.configure( ->
  rest_server.use express.static(__dirname + '/../public')
  #rest_server.use(express.bodyParser())
  rest_server.set 'views', __dirname + '/../public/views'
)

dashboardModel = new models.DashboardModel()
dashboardModel.populateTestData()
 
io_server.sockets.on "connection", (socket) ->
  
  socket.join('allowances')
  socket.on "cli", (d) ->
    socket.emit "updateView", dashboardModel.monthlyallowances.get("10-2011").xport()

# === Live Data ===
package_timeout = 0
package_data = []

stream_jsrpc.connect()
stream_jsrpc.query("SQL:subscribe BWStatsLast 127.0.0.1 ")

stream_jsrpc.on('message', (msg) ->
  if msg isnt "Success"
    package_data.push pkg for pkg in msg
    if package_timeout then clearTimeout(package_timeout)
    package_timeout = setTimeout( ->
      io_server.sockets.in('allowances').emit 'updateView', dashORM.liveUpdate(package_data)
      package_data.length = 0
    , 3000)

    console.log ("Added to package")
)

stream_jsrpc.on('timedout', ->
  log.error "JSRPC timed out, process exiting"
  process.exit(1)
)
log.info "JSRPC setup executed"

rest_server.get('/', (req,res) ->
  res.redirect('/allowances')
)

rest_server.get('/:base', (req, res) ->
  if req.params.base.indexOf(".") is -1
    res.render(req.params.base+'.ejs')
)

rest_server.get('/:base/*?', (req, res) ->

  if req.xhr
    dashORM.query req.params.base, req.params[0].split("/"), res
  else if req.params.base.indexOf(".") is -1
    res.render(req.params.base+'.ejs')
)

if !module.parent
  rest_server.listen(DASHBOARD_PORT, ->
    addr = rest_server.address()
  )
  log.notice "Dashboard server listening on port " + DASHBOARD_PORT
  process.on 'SIGINT', ->
    stream_jsrpc.disconnect()
    stream_jsrpc.on 'disconnected', ->
      log.notice "HWDashboard killed by SIGINT, exited gracefully"
      process.exit(0)
    process.exit(0)
  """
