MYSQL_HOST      = 'localhost'
MYSQL_PORT      = 3306
MYSQL_USERNAME  = 'homework'
MYSQL_PASSWORD  = 'whatever'
MYSQL_DATABASE  = 'bandwidth_data'

models = require('../public/scripts/models').models
mysql_lib = require('mysql')
dashboardModel = new models.DashboardModel()
#dashboardModel.populateTestData()
 
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
        return @getMonthlyAllowance parameters[0], parameters[1]

      when "usage"
        console.log "No usage ORM"
        #multiple classes likely

  getMonthlyAllowance: (year, month) ->

    month_id     = year + "-" + month
    date_string  = month_id + "-01"

    dashboardModel.monthlyallowances.add(
      new models.MonthlyAllowance(
        { id: month_id }
      )
    )

    month_totals = mysql.query(
      "SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " +
      "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip",
      [date_string, date_string]
    )

    month_totals.on 'row', (row) ->
      dashboardModel.monthlyallowances.get(month_id).devices.add(
        new models.Allowance
          {
            id:         row.ip
            usage:      row.bytes
            allowance:  0
          }
      )

    console.log "hi"
    console.log dashboardModel.monthlyallowances.get(month_id)
    return dashboardModel.monthlyallowances.get(month_id)

exports.dashorm = new DashORM
