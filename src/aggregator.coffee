MYSQL_HOST      = 'localhost'
MYSQL_PORT      = 3306
MYSQL_USERNAME  = 'homework'
MYSQL_PASSWORD  = 'whatever'
MYSQL_DATABASE  = 'bandwidth_data'

mysql_lib         = require('mysql')
hwdb_aggregator   = require('./hwdbaggregator').hwdbaggregator
cron              = require('cron').CronJob

class Aggregator

  mysql = null

  initialize: () ->

    hwdb_aggregator.initialize()

    mysql = mysql_lib.createClient({
      host:       MYSQL_HOST
      port:       MYSQL_PORT
      user:       MYSQL_USERNAME
      password:   MYSQL_PASSWORD
    })

    mysql.useDatabase( MYSQL_DATABASE)

    #Setup hourly cron job. Run before persistence check
    #Better to fail on a duplicate insert than miss the insert
    cron('0 0 * * * *', ->
      date_now = new Date()
      start_date = new Date date_now.getUTCFullYear(), date_now.getUTCMonth(), date_now.getUTCDate(), date_now.getUTCHours()
      end_date = new Date date_now.getUTCFullYear(), date_now.getUTCMonth(), date_now.getUTCDate(), date_now.getUTCHours()+1
      console.log start_date, end_date
      hwdb_aggregator.aggregateHour(start_date, (result) =>
        console.log result
        if result isnt "empty"
          for ip, bytes of result
            date_string = start_date.getUTCFullYear() + "/" +
                          (start_date.getUTCMonth()+1) + "/" +
                          start_date.getUTCDate()
            mysql.query("INSERT INTO bandwidth_hours (date,hour,ip,bytes) VALUES (?,?,?,?)",
                        [date_string, start_date.getUTCHours(), ip, bytes],
                        (e) ->
                          if e and e.message.indexOf("Duplicate") isnt -1
                            #Duplicate entry, TODO log.warn
                            return
            )
      )
    )
   

    last_insert_check = mysql.query('SELECT date,hour FROM bandwidth_hours ORDER BY date DESC, hour DESC LIMIT 1')

    last_insert_check.on 'row', (row) =>

      date_last = new Date row.date.getUTCFullYear(), row.date.getUTCMonth(), row.date.getUTCDate()+1, row.hour+1

      # Hours is 0-23, so we +1 but then -1 as we are looking for the previous hour
      date_now = new Date()
      expected_last_date = new Date date_now.getUTCFullYear(), date_now.getUTCMonth(), date_now.getUTCDate(), date_now.getUTCHours()

      console.log date_last.toUTCString(), expected_last_date.toUTCString()
      #Check for lost aggregate data
      if date_last < expected_last_date
        missing_hours = ((expected_last_date - date_last) / 1000) / 60 / 60
        missing_hours--
        @recursivePopulator(expected_last_date, missing_hours)

  recursivePopulator: (end_date, hour_count) ->

    console.log "End: " + end_date.toUTCString()
    start_date = new Date(Date.UTC(
                            end_date.getUTCFullYear(),
                            end_date.getUTCMonth(),
                            end_date.getUTCDate(),
                            end_date.getUTCHours() - hour_count
                          ))
 
    console.log "Start: " + start_date.toUTCString()
    hwdb_aggregator.aggregateHour(start_date, (result) =>
      console.log result
      if result isnt "empty"
        for ip, bytes of result
          date_string = start_date.getUTCFullYear() + "/" +
                        (start_date.getUTCMonth()+1) + "/" +
                        start_date.getUTCDate()
          mysql.query("INSERT INTO bandwidth_hours (date,hour,ip,bytes) VALUES (?,?,?,?)",
                      [date_string, start_date.getUTCHours(), ip, bytes],
                      (e) ->
                        if e and e.message.indexOf("Duplicate") isnt -1
                          #Duplicate entry, TODO log.warn
                          return
          )
      if (hour_count) > 0
        #console.log "Ignored"
        console.log "Recursive call"
        setTimeout( =>
          @recursivePopulator(end_date, hour_count-1)
        ,10000)
    )

  destroy: () ->
    hwdb_aggregator.destroy()

exports.aggregator = new Aggregator
