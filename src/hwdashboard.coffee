LOG_LEVEL       = 5 # Log.NOTICE
DASHBOARD_PORT  = 80

"""
aggregator = require('./aggregator').aggregator

aggregator.initialize()
"""
HWDashboardLogger = require('./logger').logger
log = new HWDashboardLogger "hwdbdashboard", LOG_LEVEL

log.notice "Starting HWDashboard"

stream_jsrpc  = require('./jsrpc').jsrpc
query_jsrpc   = require('./jsrpc').jsrpc
now_app       = require('now')
express       = require('express')

models = require('../public/scripts/models').models

rest_server = express.createServer()
io_server   = now_app.initialize(rest_server)

rest_server.configure( ->
  rest_server.use express.static(__dirname + '/../public')
  rest_server.use(express.bodyParser())
  rest_server.set 'views', __dirname + '/../public/views'
)

io_server.now.serverOutput = (data) ->
  dashboardModel = new models.DashboardModel()
  dashboardModel.populateTestData()
  io_server.now.updateView dashboardModel.monthlyallowances.get("October-2011").xport()
"""
stream_jsrpc.connect()
stream_jsrpc.query("SQL:subscribe BWUsageLast 127.0.0.1 ")

stream_jsrpc.on('timedout', ->
  log.error "JSRPC timed out, process exiting"
  process.exit(1)
)
log.info "JSRPC setup executed"

dd = require('./dummydata').dummy_data
state_builder = require('./statebuilder').statebuilder

# Update todays state from stream
stream_jsrpc.on('message', (data) ->
  if data is "Success"
    console.log "Connected"
  else
    todays_state = state_builder.parseResult(data, todays_state)
    console.log todays_state
    io_server.now.updateView todays_state
<F2>)
io_server.now.queryMonths = (startYear, startMonth, endYear, endMonth) ->

  #TO BE FIXED, TIMEZONE INVALID DUE TO DST
  month_start = new Date(startYear, startMonth+1, 1)
  month_end   = new Date(endYear, endMonth+1, 1)

  ns = state_builder.parseResult(dd[0], 0, month_start, month_end)
  io_server.now.updateView ns
  
  query_jsrpc.query("SQL:select * from BWUsage range (" + month_start + ", " + month_end + ")") 

  query_jsrpc.on('message', (data) ->
    io_server.now.updateView state_builder.parseResult(data, 0, month_start, month_end)
  )
"""

rest_server.get('/allowances', (req, res) ->
  res.render('allowances.ejs')
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
    process.exit(0)
"""
