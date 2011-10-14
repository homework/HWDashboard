MYSQL_HOST      = 'localhost'
MYSQL_PORT      = 3306
MYSQL_USERNAME  = 'homework'
MYSQL_PASSWORD  = 'whatever'
MYSQL_DATABASE  = 'bandwidth_data'

mysql_lib         = require('mysql')
hwdb_aggregator   = require('./hwdbaggregator').hwdbaggregator

class Aggregator

  mysql = null

  initialize: () ->

    mysql = mysql_lib.createClient({
      host:       MYSQL_HOST
      port:       MYSQL_PORT
      user:       MYSQL_USERNAME
      password:   MYSQL_PASSWORD
    })

    mysql.useDatabase( MYSQL_DATABASE)

    #Setup hourly cron job. Run before persistence check
    #Better to fail on a duplicate insert than miss the insert

    last_insert_check = mysql.query('SELECT date,hour FROM bandwidth_hours ORDER BY date DESC, hour DESC LIMIT 1')

    last_insert_check.on 'row', (row) =>

      date_last = new Date row.date.getUTCFullYear(), row.date.getUTCMonth(), row.date.getUTCDate()+1, row.hour

      # Hours is 0-23, so we +1 but then -1 as we are looking for the previous hour
      date_now = new Date()
      expected_last_date = new Date date_now.getUTCFullYear(), date_now.getUTCMonth(), date_now.getUTCDate(), date_now.getUTCHours()+1

      #Check for lost aggregate data
      if date_last < expected_last_date
        missing_hours = ((expected_last_date - date_last) / 1000) / 60 / 60
        console.log missing_hours
        @recursivePopulator(expected_last_date, missing_hours)

  recursivePopulator: (end_date, hour_count) ->

    console.log "End: " + end_date
    start_date = new Date(
                            end_date.getUTCFullYear(),
                            end_date.getUTCMonth(),
                            end_date.getUTCDate(),
                            end_date.getUTCHours() + 2 - hour_count
                          )
 
    console.log "Start: " + start_date.toLocaleString()
    hwdb_aggregator.aggregateHour(start_date, (result) =>
      #INSERT
      #mysql.query('INSERT INTO bandwidth_hours (date,hour,ip,bytes) VALUES (?,?,?,?)',
      #                [date, hour, ip, sum[device]]
      if (hour_count-1) > 0
        @recursivePopulator(end_date, hour_count-1)
    )

exports.aggregator = new Aggregator
