MYSQL_HOST      = 'localhost'
MYSQL_PORT      = 3306
MYSQL_USERNAME  = 'homework'
MYSQL_PASSWORD  = 'whatever'
MYSQL_DATABASE  = 'bandwidth_data'

mysql_lib = require('mysql')

class DashORM
  
  mysql = null

  initialize: () ->

    mysql = mysql_lib.createClient({
      host:       MYSQL_HOST
      port:       MYSQL_PORT
      user:       MYSQL_USERNAME
      password:   MYSQL_PASSWORD
    })

    mysql.useDatabase MYSQL_DATABASE

  query: (model, parameters) ->

    switch model

      when "allowances"
        return getMonthlyAllowance parameters[0], parameters[1]

      when "usage"
        console.log "No usage ORM"
        #multiple classes likely

  getMonthlyAllowance: (year, month) ->

    month_id     = year + "-" + month
    date_string += month_id + "-01"

    m = new models.MonthlyAllowance(
      { id: month_id }
    )

    month_totals = mysql.query(
      "SELECT ip, SUM(bytes) FROM bandwidth_data WHERE date " +
      "BETWEEN '?' AND DATE_ADD('?', INTERVAL 1 MONTH) GROUP BY ip",
      [date_string, date_string]
    )

    month_totals.on 'row', (row) ->
      models.monthlyallowances.get(month_id).devices.add(
        new models.MonthlyAllowance
          {
            id:         row.ip
            usage:      row.bytes
            allowance:  0
          }
      )

exports.dashorm = new DashORM
