MYSQL_HOST      = 'localhost'
MYSQL_PORT      = 3306
MYSQL_USERNAME  = 'homework'
MYSQL_PASSWORD  = 'whatever'
MYSQL_DATABASE  = 'bandwidth_data'

models       = require('../public/scripts/models').models
mysqlLib     = require('mysql')

HWState = require('./hwstate').hwstate

class DashORM
  
  constructor: ->

    @stateC = new HWState

    @stateC.on 'update', (s) =>
      console.log "Got update"
      @state = s
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

          if (current_date - last_update) < 360000000
            console.log "Returned in-memory model"
            if response
              response.json @dashboardModel.monthlyallowances.get(month_str).xport()
            else
              return response.json @dashboardModel.monthlyallowances.get(month_str).xport()

        ma = new models.MonthlyAllowance(
              { id: month_str }
        )

        month_totals = @mysql.query(
          "SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " +
          "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip",
          [date_string, date_string]
        )

        month_totals.on 'row', (mysql_row) =>

          if mysql_row.ip isnt '0.0.0.0'

            device = @state.devices.get(mysql_row.ip)

            if device.has("user")
              ma.users.add(
                new models.Allowance(
                  {
                    id:         device.get("user")
                    usage:      parseInt(mysql_row['SUM(bytes)'])
                    allowance:  (device.get("allowance") || -1)
                  }
                )
              )

            ma.devices.add(
              new models.Allowance(
                {
                  id:         mysql_row.ip
                  usage:      parseInt(mysql_row['SUM(bytes)'])
                  allowance:  (device.get("allowance") || -1)
                }
              )
            )

            current_household_usage = ma.household.get("usage")

            ma.household.set(
              { usage: parseInt(current_household_usage) + parseInt(mysql_row['SUM(bytes)']) }
            )

        ma.household.set({ allowance: @state.devices.get("HOME").get("allowance") })

        if this_month
          @dashboardModel.monthlyallowances.remove(month_str)
          @dashboardModel.monthlyallowances.add(ma)

        if response then response.json ma.xport() else return ma.xport()
           
      when "usage"
        console.log "No usage ORM"
        #multiple classes likely

  liveUpdate: (package) ->

    for item in package

      item_date = new Date( parseInt(item.timestamp) * 100 )
      item_str = item_date.getFullYear()+"-"+(item_date.getMonth()+1)

      month_model = @dashboardModel.monthlyallowances.get(item_str)

      if month_model isnt undefined

        hh_usage = month_model.household.get("usage")
        month_model.household.set(
          { usage: hh_usage + parseInt(item.bytes) }
        )

        device_state = @state.devices.get(item.ipaddr)

        if device_state.has("user")

          user_model = month_model.users.get(user)
         
          if user_model
            user_model.set( { usage: parseInt(user_model.get("usage")) + parseInt(item.bytes) } )
          else
            user_total_usage = 0
            user_total_allowance = 0

            month_model.devices.each( (mm_device) =>
              if @state.devices[mm_device.id].get("user") is @state.devices[item.ipaddr].get("user")
                console.log "Matched user"
                user_total_usage += mm_device.get("usage")
                user_total_allowance += mm_device.get("allowance")
            )

            month_model.users.add(
              new models.Allowance(
                {
                  id:         @state.devices[item.ipaddr].get("user")
                  usage:      user_total_usage
                  allowance:  user_total_allowance
                }
              )
            )

        device = month_model.devices.get(item.ipaddr)

        if device
          device.set( { usage: parseInt(device.get("usage")) + parseInt(item.bytes) } )
        else
          month_model.devices.add(
            new models.Allowance(
              {
                id:         @state.devices[item.ipaddr]
                usage:      parseInt(item.bytes)
                allowance:  parseInt(@state.devices[item.ipaddr].get("allowance"))
              }
            )
          )

    if month_model isnt undefined
      return @dashboardModel.monthlyallowances.get(item_str).xport()
  
  updateORMState: () ->


exports.dashorm = DashORM
