MYSQL_HOST      = 'localhost'
MYSQL_PORT      = 3306
MYSQL_USERNAME  = 'homework'
MYSQL_PASSWORD  = 'whatever'
MYSQL_DATABASE  = 'bandwidth_data'

models       = require('../public/scripts/models').models
mysqlLib     = require('mysql')

class DashORM
  
  constructor: ->

    @dashboardModel = new models.DashboardModel()
    #@dashboardModel.populateTestData()
 
    @mysql = mysqlLib.createClient({
      host:       MYSQL_HOST
      port:       MYSQL_PORT
      user:       MYSQL_USERNAME
      password:   MYSQL_PASSWORD
    })

    @mysql.useDatabase MYSQL_DATABASE

  query: (model, parameters, response=0) =>

    switch model

      when "allowances"

        month_str    = parameters[0] + "-" + parameters[1]
        month_id     = parameters[0] + "/" + parameters[1]
        date_string  = month_str + "-01"

        current_date  = new Date()
        this_month = (current_date.getFullYear() is parseInt(parameters[0]) and
                     (current_date.getMonth()+1) is parseInt(parameters[1])
        )

        #Return in memory allowance for current month
        if this_month and @dashboardModel.monthlyallowances.get(month_str) isnt undefined

          last_update  = @dashboardModel.monthlyallowances.get(month_str).lastUpdated

          if current_date - last_update < 360000
            if response then response.json @dashboardModel.monthlyallowances.get(month_str).xport() else return response.json @dashboardModel.monthlyallowances.get(month_str).xport()
            return

        ma = new models.MonthlyAllowance(
              { id: month_str }
        )
        
        ma.household.set({ allowance: 5000000000 })#TODO

        month_totals = @mysql.query(
          "SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " +
          "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip",
          [date_string, date_string]
        )

        month_totals.on 'row', (row) ->
          ma.devices.add(
            new models.Allowance(
              {
                id:         row.ip
                usage:      parseInt(row['SUM(bytes)'])
                allowance:  5000000000#TODO
              }
            )
          )
          current_household_usage = ma.household.get("usage")
          ma.household.set(
            { usage: current_household_usage + parseInt(row['SUM(bytes)']) }
          )

        month_totals.on 'end', (result) =>
          if this_month then @dashboardModel.monthlyallowances.add(ma)
          if response then response.json ma.xport() else return ma.xport()
       
      when "usage"
        console.log "No usage ORM"
        #multiple classes likely

  liveUpdate: (package) ->

    for item in package
      item_date = new Date( parseInt(item.timestamp) * 100 )
      item_str = item_date.getFullYear()+"-"+(item_date.getMonth()+1)
      # Update MonthlyAllowance model
      month_model = @dashboardModel.monthlyallowances.get(item_str)
      if month_model isnt undefined
        hh_usage = month_model.household.get("usage")
        @dashboardModel.monthlyallowances.get(item_str).household.set(
          { usage: hh_usage + parseInt(item.bytes) }
        )
        #update device
        #update household

    if month_model isnt undefined
      return @dashboardModel.monthlyallowances.get("2011-10").xport()
    #S.emit @dashboardModel.monthlyallowances.get(month_str).xport()

exports.dashorm = DashORM
