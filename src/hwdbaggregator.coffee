EventEmitter = require('events').EventEmitter
hwdb = require('./jsrpc').jsrpc

class HWDBAggregator extends EventEmitter

  initialize: () ->

    hwdb.connect()

  aggregateHour: (date, callback) ->

    start_ts  = (new Date(
                            date.getUTCFullYear(),
                            date.getUTCMonth(),
                            date.getUTCDate(),
                            date.getUTCHours()
                          )
                ).getTime()

    end_ts    = start_ts + 3600000

    console.log start_ts

    @aggregateQuery start_ts, end_ts, callback

  aggregateQuery: (start, end, callback) ->
    
    if callback then callback("bk")
    
    #hwdb.query("SQL:select * from BWStats [interval [" + start + ", " + end + ")]")
    """
          #ASYNC?
          hwdb.on 'message', (data) ->
            #MAP->REDUCE magic?
            for each entry
              sum[device]++
    """

exports.hwdbaggregator = new HWDBAggregator
