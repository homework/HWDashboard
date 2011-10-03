MYSQL_HOST      = '127.0.0.1'
MYSQL_PORT      = 3306
MYSQL_USERNAME  = 'homework'
MYSQL_PASSWORD  = 'whatever'
MYSQL_DATABASE  = 'bandwidth_data'

mysql_lib = require('mysql')
hwdb      = require('./jsrpc').jsrpc

class Aggregator

  mysql = null

  initialize: () ->

    hwdb.connect()

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

    last_insert_check.on 'row', (row) ->

      date_last = new Date row.date.getUTCFullYear(), row.date.getUTCMonth(), row.date.getUTCDay()+1, row.hour

      # Hours is 0-23, so we +1 but then -1 as we are looking for the previous hour
      date_now = new Date()
      expected_last_date = new Date date_now.getUTCFullYear(), date_now.getUTCMonth(), date_now.getUTCDay(), date_now.getUTCHours()

      #Check for lost aggregate data
      if date_last.toLocaleString() < expected_last_date.toLocaleString()
        console.log "Data missing"
        """
        START_HOUR
        END_HOUR

        #SETUP A SEQUENCE
        for each missing hour
          hwdb.query("SQL:select * from BWUsage where START END")
          #ASYNC?
          hwdb.on 'message', (data) ->
            #MAP->REDUCE magic?
            for each entry
              sum[device]++

            mysql.query('INSERT INTO bandwidth_hours (date,hour,ip,bytes) VALUES (?,?,?,?)',
                      [date, hour, ip, sum[device]]
            )

        CHECK:
          SELECT .. BETWEEN START AND END
          NUMBER OF ROWS CORRECT?
        """

exports.aggregator = new Aggregator
