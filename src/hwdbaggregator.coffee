EventEmitter = require('events').EventEmitter
hwdb = require('./jsrpc').jsrpc
__ = require('underscore')._

class HWDBAggregator extends EventEmitter

  initialize: () ->

    hwdb.connect()

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
    #query += "2011/10/18:12:21:00, 2011/10/18:12:22:00)]"

    console.log "Querying: " + query
    hwdb.once 'message', (rows) ->

      if rows[0].status is "Success"
        console.log "Status is successful"
        if rows[0].rows > 0
          results = __(rows.slice(1)).map((row) ->
            row_data = {}
            row_data[row.ipaddr] = parseInt(row.bytes)
            return row_data
          ).reduce( (totals, row) ->
            for ip, bytes of row
              if !isNaN(bytes)
                totals[ip] = (totals[ip] || 0) + bytes
            return totals
          )
          if callback then callback(results)
        else
          console.log "Empty result"
          if callback then callback("empty")

    hwdb.query(query)

  destroy: () ->
    hwdb.disconnect()
    hwdb.on 'disconnected', ->
      console.log "DC"
      #log.notice "HWDBAggregator successfully disconnected"

exports.hwdbaggregator = new HWDBAggregator
