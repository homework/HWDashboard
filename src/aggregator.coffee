MYSQL_HOST      = 'localhost'
MYSQL_PORT      = 3306
MYSQL_USERNAME  = 'homework'
MYSQL_PASSWORD  = 'whatever'
MYSQL_DATABASE  = 'bandwidth_data'

mysqlLib         = require('mysql')
HWDBAggregator   = require('./hwdbaggregator').hwdbaggregator
cron              = require('cron').CronJob

class Aggregator

  constructor: ->

    @hwdb_aggregator = new HWDBAggregator

    @hwdb_aggregator.once 'connected', =>

      @mysql = mysqlLib.createClient({
        host:       MYSQL_HOST
        port:       MYSQL_PORT
        user:       MYSQL_USERNAME
        password:   MYSQL_PASSWORD
      })

      @mysql.useDatabase( MYSQL_DATABASE )

      #UNIQUEness
      cron('0 */1 * * * *', =>

        date_now = new Date()

        last_insert_check = @mysql.query('SELECT date,hour FROM bandwidth_hours ORDER BY date DESC, hour DESC LIMIT 1',
                            (err, results) =>

                              #No rows in table, create first row as reference record
                              if results.length is 0

                                last_hour = new Date(Date.UTC(
                                                        date_now.getUTCFullYear(),
                                                        date_now.getUTCMonth(),
                                                        date_now.getUTCDate(),
                                                        date_now.getUTCHours() - 1
                                                    ))

                                date_string = date_now.getUTCFullYear() + "/" +
                                              (date_now.getUTCMonth()+1) + "/" +
                                              (date_now.getUTCDate())

                                @mysql.query('INSERT INTO bandwidth_hours (date,hour,ip,bytes) VALUES (?,?,?,?)',
                                            [date_string, last_hour.getUTCHours(), "0.0.0.0", 0]
                                )

                            )
   
        last_insert_check.once 'row', (row) =>

          date_last = new Date(Date.UTC(
                                  row.date.getFullYear(),
                                  row.date.getMonth(),
                                  row.date.getDate(),
                                  row.hour
                            )
          )

          expected_last_date = new Date(Date.UTC(
                                          date_now.getUTCFullYear(),
                                          date_now.getUTCMonth(),
                                          date_now.getUTCDate(),
                                          (date_now.getUTCHours()-1)
                                      )
          )

          console.log date_last, expected_last_date

          if date_last < expected_last_date
            missing_hours = ((expected_last_date - date_last) / 1000) / 60 / 60
            if missing_hours >= (3600 / @hwdb_aggregator.getQueryInterval() )
              missing_hours = (3600 / @hwdb_aggregator.getQueryInterval() )
            missing_hours--
            @recursivePopulator(expected_last_date, missing_hours)

      )

  recursivePopulator: (end_date, hour_count) ->

    start_date = new Date(Date.UTC(
                            end_date.getUTCFullYear(),
                            end_date.getUTCMonth(),
                            end_date.getUTCDate(),
                            end_date.getUTCHours() - hour_count
                          ))
 
    @hwdb_aggregator.aggregateHour(start_date, (result) =>

      if result isnt 0

        for ip, bytes of result

          date_string = start_date.getUTCFullYear() + "/" +
                        (start_date.getUTCMonth()+1) + "/" +
                        (start_date.getUTCDate())

          @mysql.query("INSERT INTO bandwidth_hours (date,hour,ip,bytes) VALUES (?,?,?,?)",
                      [date_string, start_date.getUTCHours(), ip, bytes],
                      (e) ->
                        if e and e.message.indexOf("Duplicate") isnt -1
                          #Duplicate entry, TODO log.warn
                          return
          )

      else

        date_string = start_date.getUTCFullYear() + "/" +
                      (start_date.getUTCMonth()+1) + "/" +
                      (start_date.getUTCDate())

        @mysql.query("INSERT INTO bandwidth_hours (date,hour,ip,bytes) VALUES (?,?,?,?)",
                    [date_string, start_date.getUTCHours(), "0.0.0.0", 0],
                    (e) ->
                      if e and e.message.indexOf("Duplicate") isnt -1
                        return
        )

      if hour_count > 0

        setTimeout( =>
          @recursivePopulator(end_date, hour_count-1)
        ,10000)

    )

  destroy: () ->

    @hwdb_aggregator.destroy()

exports.aggregator = Aggregator
