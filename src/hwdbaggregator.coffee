EventEmitter = require('events').EventEmitter
JSRPC = require('./jsrpc').jsrpc
hwdb_live = new JSRPC("127.0.0.1", 987)
hwdb_historical = new JSRPC("127.0.0.1", 990)
__ = require('underscore')._

class HWDBAggregator extends EventEmitter

  initialize: () ->

    hwdb_live.connect()
    hwdb_historical.connect()
    console.log "Double connect"

  leadingZero: (num) ->
    if num < 10 then return ("0"+num) else return num

  formatDate: (date) ->
    date_str =  date.getUTCFullYear() + "/" +
                @leadingZero( date.getUTCMonth()+1 ) + "/" +
                @leadingZero( date.getUTCDate()    ) + ":" +
                @leadingZero( date.getUTCHours() ) + ":" +
                @leadingZero( date.getUTCMinutes() ) + ":" +
                @leadingZero( date.getUTCSeconds() )
    return date_str
 
  aggregateHour: (date, callback) ->

    start_ts  = (new Date(Date.UTC(
                            date.getUTCFullYear(),
                            date.getUTCMonth(),
                            date.getUTCDate(),
                            date.getUTCHours()
                          )
                ).getTime())

    end_ts    = start_ts + 3600000

    @aggregateQuery start_ts, end_ts, callback

  aggregateQuery: (start, end, callback) ->
    
    start_str = @formatDate( new Date(start) )
    end_str = @formatDate( new Date(end) )

    query =   "SQL:select * from BWStats [interval ("
    query +=  start_str + ", "
    query +=  end_str + ")]"

    console.log "Querying: " + query
    hwdb_historical.once 'message', (rows) =>

      historical_result = 0
      live_result       = 0

      if rows[0].status is "Success"
        if rows[0].rows > 0
          historical_result = __(rows.slice(1)).map((row) ->
            row_data = {}
            row_data[row.ipaddr] = parseInt(row.bytes)
            return row_data
          ).reduce( (totals, row) ->
            for ip, bytes of row
              if !isNaN(bytes)
                totals[ip] = (totals[ip] || 0) + bytes
            return totals
          )

      hwdb_live.once 'message', (rows) =>
        if rows[0].status is "Success"
          if rows[0].rows > 0
            live_result = __(rows.slice(1)).map((row) ->
              row_data = {}
              row_data[row.ipaddr] = parseInt(row.bytes)
              return row_data
            ).reduce( (totals, row) ->
              for ip, bytes of row
                if !isNaN(bytes)
                  totals[ip] = (totals[ip] || 0) + bytes
              return totals
            )
        hour_result = historical_result if historical_result?
        console.log historical_result, live_result
        #if live_result?
        callback("empty")
      hwdb_live.query(query)

    hwdb_historical.query(query)

  destroy: () ->
    hwdb_live.disconnect()
    hwdb_live.on 'disconnected', ->
      console.log "Live DC"
    hwdb_historical.disconnect()
    hwdb_historical.on 'disconnected', ->
      console.log "Historical DC"
      #log.notice "HWDBAggregator successfully disconnected"

exports.hwdbaggregator = new HWDBAggregator
