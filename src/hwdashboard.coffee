LOG_LEVEL       = 5 # Log.NOTICE
DASHBOARD_PORT  = 80

sio_app           = require('socket.io')
express           = require('express')
path              = require('path')

DashORM           = require('./dashorm').dashorm
HWDashboardLogger = require('./logger').logger
JSRPC             = require('./jsrpc').jsrpc

models = require('../public/scripts/models').models

dashORM           = new DashORM
log               = new HWDashboardLogger "hwdbdashboard", LOG_LEVEL
hwdb_stream       = new JSRPC
hwdb_query        = new JSRPC

Aggregator = require('./aggregator').aggregator
@aggregator = new Aggregator

log.notice "Starting HWDashboard"

rest_server = express.createServer()
io_server = sio_app.listen(rest_server)

rest_server.configure( ->
  rest_server.use express.static(__dirname + '/../public')
  rest_server.set 'views', __dirname + '/../public/views'
)

io_server.sockets.on "connection", (socket) ->
  
  socket.join('allowances')
  socket.on "cli", (d) ->
    socket.emit "updateView", dashORM.query("allowances", "10-2011")

# === Live Data ===
package_timeout = 0
package_data = []

hwdb_stream.connect()
hwdb_stream.query("SQL:subscribe BWStatsLast 127.0.0.1 ")

hwdb_stream.on('message', (msg) ->
  if msg[0].rows isnt 0
    package_data.push pkg for pkg in msg
    if package_timeout then clearTimeout(package_timeout)
    package_timeout = setTimeout( ->
      io_server.sockets.in('allowances').emit 'updateView', dashORM.liveUpdate(package_data)
      package_data.length = 0
    , 3000)

    console.log ("Added to package")
)

hwdb_stream.on('timedout', ->
  log.error "JSRPC timed out, process exiting"
  process.exit(1)
)

log.info "JSRPC setup executed"

rest_server.get('/', (req,res) ->
  res.redirect('/allowances')
)

rest_server.get('/:base', (req, res) ->
  path.exists('./public/views/'+req.params.base+'.ejs', (exists) ->
    if req.params.base.indexOf(".") is -1 and exists
      res.render(req.params.base+'.ejs')
  )
)

rest_server.get('/:base/*?', (req, res) ->

  if req.xhr
    dashORM.query req.params.base, req.params[0].split("/"), res
  else if req.params.base.indexOf(".") is -1
    path.exists('./public/views/'+req.params.base+'.ejs', (exists) ->
      if req.params.base.indexOf(".") is -1 and exists
        res.render(req.params.base+'.ejs')
    )
)

if !module.parent
  rest_server.listen(DASHBOARD_PORT, ->
    addr = rest_server.address()
  )
  log.notice "Dashboard server listening on port " + DASHBOARD_PORT
  process.on 'SIGINT', ->
    hwdb_stream.disconnect()
    hwdb_stream.on 'disconnected', ->
      log.notice "HWDashboard killed by SIGINT, exited gracefully"
      process.exit(0)
    process.exit(0)
