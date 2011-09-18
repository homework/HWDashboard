LOG_LEVEL       = 5 # Log.NOTICE
DASHBOARD_PORT  = 3010

#if d flag set then LOG_LEVEL = 7 # Log.DEBUG

HWDashboardLogger = require('./logger').logger

log = new HWDashboardLogger "hwdbdashboard", LOG_LEVEL

log.notice "Starting HWDashboard"

stats_jsrpc = require('./jsrpc').jsrpc
sockio  = require('socket.io')
express = require('express')

rest_server = express.createServer()
io_server   = sockio.listen(rest_server)

rest_server.configure( ->
  rest_server.use(express.bodyParser())
)

events = io_server
  .of('/events')

stats = io_server
  .of('/stats')

log.info "Socket.IO now listening on /events and /stats"

stats_jsrpc.connect()
stats_jsrpc.query("SQL:subscribe SysLast 192.168.1.78 ")

stats_jsrpc.on('message', (data) ->
  stats.emit('network_stream', data)
)

stats_jsrpc.on('timedout', ->
  log.error "JSRPC timed out, process exiting"
  process.exit(1)
)

log.info "JSRPC setup executed"

rest_server.get('/', (req, res) ->
    res.sendfile('public/index.html')
)

rest_server.post('/stats', (req, res) ->
  if req.body.bytes? and req.body.packets?
    stats.emit( 'network_stream', req.body.bytes, req.body.packets )
    res.json({result : true })
  else
    res.json({result : false})
)

if !module.parent
  rest_server.listen(DASHBOARD_PORT, ->
    addr = rest_server.address()
  )
  log.notice "Dashboard server listening on port " + DASHBOARD_PORT

  process.on 'SIGINT', ->
    stats_jsrpc.disconnect()
    stats_jsrpc.on 'disconnected', ->
      log.notice "HWDashboard killed by SIGINT, exited gracefully"
      process.exit(0)
