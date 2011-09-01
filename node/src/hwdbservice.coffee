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
