stats_jsrpc  = require('./jsrpc').jsrpc

sockio  = require('socket.io')
express = require('express')

pres_server = express.createServer()
io_server   = sockio.listen(pres_server)

pres_server.configure ->
  pres_server.use express.static(__dirname + '/../public')
  pres_server.use express.logger()
  pres_server.use express.bodyParser()

pres_server.get '/', (req, res) ->
  res.sendfile '../public/index.html'


events = io_server
  .of('/events')

stats = io_server
  .of('/stats')


#stats_jsrpc.connect()
#stats_jsrpc.query("SQL:subscribe StatsLast 192.168.1.78 ")

stats_jsrpc.on('message', (data) ->
  stats.emit('network_stream', data)
)

if !module.parent
  pres_server.listen(3010, ->
    addr = pres_server.address()
    console.log("Started presentation server")
  )

