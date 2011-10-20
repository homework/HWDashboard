Aggregator = require('./aggregator').aggregator
aggregator = new Aggregator

process.on 'SIGINT', ->
  aggregator.destroy()
  setTimeout( ->
    process.exit(0)
  ,5000
  )
