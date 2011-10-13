MYSQL_HOST      = 'localhost'
MYSQL_PORT      = 3306
MYSQL_USERNAME  = 'homework'
MYSQL_PASSWORD  = 'whatever'
MYSQL_DATABASE  = 'bandwidth_data'

models        = require('../public/scripts/models').models
mysql_lib     = require('mysql')

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

  query: (model, parameters, response) =>

    switch model

      when "allowances"
        month_str    = parameters[0] + "-" + parameters[1]
        month_id     = parameters[0] + "/" + parameters[1]
        date_string  = month_str + "-01"

        #TODO Code for model not existing
        current_date  = new Date()
        if dashboardModel.monthlyallowances.get(month_str) isnt undefined
          last_update  = dashboardModel.monthlyallowances.get(month_str).lastUpdated
        else
          last_update  = new Date(0)
        console.log current_date - last_update

        #Return in memory allowance for current month
        if  current_date.getFullYear() is parseInt(parameters[0]) and
           (current_date.getMonth()+1) is parseInt(parameters[1]) and
            (current_date - last_update < 360000)
          response.json dashboardModel.monthlyallowances.get(month_str).xport()
        else
          
          if dashboardModel.monthlyallowances.get(month_str) is undefined
            dashboardModel.monthlyallowances.add(
              new models.MonthlyAllowance(
                { id: month_str }
              )
            )

          month_totals = mysql.query(
            "SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " +
            "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip",
            [date_string, date_string]
          )

          month_totals.on 'row', (row) ->
            dashboardModel.monthlyallowances.get(month_str).devices.add(
              new models.Allowance(
                {
                  id:         row.ip
                  usage:      parseInt(row['SUM(bytes)'])
                  allowance:  5000000000
                }
              )
            )
            current_household_usage = dashboardModel.monthlyallowances.get(month_str).household.get("usage")
            dashboardModel.monthlyallowances.get(month_str).household.set(
              { usage: current_household_usage + parseInt(row['SUM(bytes)']) }
            )

          month_totals.on 'end', () =>
            response.json dashboardModel.monthlyallowances.get(month_str).xport()
          
      when "usage"
        console.log "No usage ORM"
        #multiple classes likely

  liveUpdate: (package) ->

    for item in package
      item_date = new Date( parseInt(item.timestamp) * 100 )
      item_str = item_date.getFullYear()+"-"+(item_date.getMonth()+1)
      # Update MonthlyAllowance model
      hh_usage = dashboardModel.monthlyallowances.get(item_str).household.get("usage")
      dashboardModel.monthlyallowances.get(item_str).household.set(
        { usage: hh_usage + parseInt(item.bytes) }
      )
      #update device
      #update household

    return dashboardModel.monthlyallowances.get("2011-10").xport()

    #S.emit dashboardModel.monthlyallowances.get(month_str).xport()











exports.dashorm = new DashORM
