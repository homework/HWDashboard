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

stats_jsrpc.connect()
stats_jsrpc.query("SQL:subscribe SysLast 192.168.1.78 ")

stats_jsrpc.on('message', (data) ->
  stats.emit('network_stream', data)
)

stats_jsrpc.on('timedout', ->
  console.log "JSRPC timed out"
  process.exit(1)
)

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
  rest_server.listen(3010, ->
    addr = rest_server.address()
    console.log("Started Express server")
  )
  #Gracefully handle termination
  process.on 'SIGINT', ->
    stats_jsrpc.disconnect()
    stats_jsrpc.on 'disconnected', ->
      process.exit(0)
