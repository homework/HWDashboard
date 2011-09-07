testCase  = require('nodeunit').testCase
jc  = require('../../lib/jsrpc').jsrpc
jc.connect()
jc.query("SQL:subscribe StatsLast 192.168.1.78 ")

jc.on('message', (data) ->
  console.log data
)
