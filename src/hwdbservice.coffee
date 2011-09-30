LOG_LEVEL       = 5 # Log.NOTICE
DASHBOARD_PORT  = 80

state =
    household:
                usage: 101010100,
                allowance: 10000000000

    users:      [
                  {
                    id : 5,
                    name: "Mum Smith",
                    usage: 3012312000,
                    allowance: 50000000000
                  },
                  {
                    id : 7,
                    name: "Dad Smith",
                    usage: 4012312000,
                    allowance: 100000000000
                  }
                ],

    devices:    [
                  {
                    id: 1,
                    name: "mac",
                    usage: 4012312000,
                    allowance: 10000000000
                  },
                  {
                    id: 4,
                    name: "nbk",
                    usage: 4012312000,
                    allowance: 112000000000
                  }
                ]

HWDashboardLogger = require('./logger').logger
log = new HWDashboardLogger "hwdbdashboard", LOG_LEVEL

log.notice "Starting HWDashboard"

stats_jsrpc = require('./jsrpc').jsrpc
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

stats_jsrpc.connect()
stats_jsrpc.query("SQL:subscribe BWUsageLast 127.0.0.1 ")

stats_jsrpc.on('message', (data) ->
  console.log data
  io_server.now.bandwidthUpdate(data)
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
  process.on 'SIGINT', ->
    stats_jsrpc.disconnect()
    stats_jsrpc.on 'disconnected', ->
      log.notice "HWDashboard killed by SIGINT, exited gracefully"
      process.exit(0)
