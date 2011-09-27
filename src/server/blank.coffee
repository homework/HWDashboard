stats_jsrpc = require('./jsrpc').jsrpc

stats_jsrpc.connect()
stats_jsrpc.query("SQL:select * from Flows [range 600 seconds]")

stats_jsrpc.on('message', (data) ->
  console.log data
)

stats_jsrpc.on('timedout', ->
  process.exit(1)
)

if !module.parent
  #Gracefully handle termination
  process.on 'SIGINT', ->
    stats_jsrpc.disconnect()
    stats_jsrpc.on 'disconnected', ->
      process.exit(0)
