LOG_LEVEL       = 5 # Log.NOTICE
DASHBOARD_PORT  = 80

#if d flag set then LOG_LEVEL = 7 # Log.DEBUG

log = new HWDashboardLogger "hwdbdashboard", LOG_LEVEL 

log.notice "Starting HWDashboard"

stats_jsrpc = new JSRPC
now_app     = require('now')
express     = require('express')

rest_server = express.createServer()
io_server   = now_app.initialize(rest_server)

rest_server.configure( ->
  rest_server.use express.static(__dirname + '/../public')
  rest_server.use(express.bodyParser())
)

io_server.now.serverOutput = (data) ->
  console.log(data)
  io_server.now.statsUpdate(50)
  setTimeout( ->
    io_server.now.statsUpdate(20)
  , 3000)

"""
stats_jsrpc.connect()
stats_jsrpc.query("SQL:subscribe SysLast 192.168.1.78 ")
"""

stats_jsrpc.on('message', (data) ->
  #  stats.emit('network_stream', data)
)

stats_jsrpc.on('timedout', ->
  log.error "JSRPC timed out, process exiting"
  process.exit(1)
)

log.info "JSRPC setup executed"

rest_server.get('/*', (req, res) ->
    res.sendfile('../public/index.html', (err) ->
      console.log err
    )
)

if !module.parent
  rest_server.listen(DASHBOARD_PORT, ->
    addr = rest_server.address()
  )
  log.notice "Dashboard server listening on port " + DASHBOARD_PORT
"""
  process.on 'SIGINT', ->
    stats_jsrpc.disconnect()
    stats_jsrpc.on 'disconnected', ->
      log.notice "HWDashboard killed by SIGINT, exited gracefully"
      process.exit(0)
"""
