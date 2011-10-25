EventEmitter = require('events').EventEmitter
JSRPC = require('./jsrpc').jsrpc
__ = require('underscore')._

QUERY_INTERVAL = 3

class HWDBAggregator extends EventEmitter

  constructor: ->

    @hwdb_live = new JSRPC("127.0.0.1", 987)
    @hwdb_historical = new JSRPC("127.0.0.1", 987)#Temporary

    @hwdb_historical.once 'connected', =>
      if @hwdb_live.getConnected()
        @emit 'connected'
      else
        @hwdb_live.once 'connected', =>
          @emit 'connected'

    @hwdb_live.connect()
    @hwdb_historical.connect()

  getQueryInterval: ->
    QUERY_INTERVAL

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

    @hwdb_historical.once 'message', (rows) =>

      historical_result = 0
      live_result       = 0

      if rows[0].status is "Success" and rows[0].rows > 0

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

      @hwdb_live.once 'message', (rows) =>

        if rows[0].status is "Success" and rows[0].rows > 0
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

        for ip,bytes of historical_result
          live_result[ip] = (live_result[ip] || 0) + bytes

        callback(live_result)

      #Timeout is a poor solution to async. To be implemented, queued queries
      setTimeout( =>
        @hwdb_live.query(query)
      , (QUERY_INTERVAL * 1000) )

    @hwdb_historical.query(query)

  destroy: () ->

    @hwdb_live.once 'disconnected', =>
      if @hwdb_historical.getConnected()
        @hwdb_historical.once 'disconnected', =>
          #TODO log
          console.log "DC"

    @hwdb_live.disconnect()
    @hwdb_historical.disconnect()

exports.hwdbaggregator = HWDBAggregator
