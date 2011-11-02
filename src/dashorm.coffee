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

    @dashboardModel = new models.DashboardModel()
    
    @mysql = mysqlLib.createClient({
      host:       MYSQL_HOST
      port:       MYSQL_PORT
      user:       MYSQL_USERNAME
      password:   MYSQL_PASSWORD
    })

    @mysql.useDatabase MYSQL_DATABASE
 
    @state_collector = new HWState( (state) =>
      @dashboardModel.monthlyallowances.add(state)
    )

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

          if response
            response.json @dashboardModel.monthlyallowances.get(month_str).xport()
          else
            return @dashboardModel.monthlyallowances.get(month_str).xport()

        month_model = @dashboardModel.monthlyallowances.get("STATE").clone()

        month_model.set( { id: month_str } )

        month_totals = @mysql.query(
          "SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " +
          "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip",
          [date_string, date_string]
        )

        month_totals.on 'row', (mysql_row) =>

          console.log mysql_row

          if mysql_row.ip isnt '0.0.0.0'

            device = month_model.devices.get mysql_row.ip

            if device? and device.has("user")

              user_total_usage = parseInt(mysql_row['SUM(bytes)'])
              username = device.get("user")

              if not month_model.users.get username
                month_model.updateUser username, parseInt(mysql_row['SUM(bytes)'])

            if username?
              month_model.updateDevice mysql_row.ip, parseInt(mysql_row['SUM(bytes)']), device.get("allowances"), username
            else if device?
              month_model.updateDevice mysql_row.ip, parseInt(mysql_row['SUM(bytes)']), device.get("allowances")
            else
              month_model.updateDevice mysql_row.ip, parseInt(mysql_row['SUM(bytes)'])

            month_model.updateHousehold mysql_row['SUM(bytes)']

        if this_month
          @dashboardModel.monthlyallowances.remove(month_str)
          @dashboardModel.monthlyallowances.add(month_model)

        if response then response.json month_model.xport() else return month_model.xport()
           
      when "usage"
        console.log "No usage ORM"
        #multiple classes likely

  liveUpdate: (package) ->

    item_str = ""

    console.log @dashboardModel.monthlyallowances.pluck("id")

    for item in package

      item_date = new Date( parseInt(item.timestamp) * 100 )
      item_str = item_date.getFullYear()+"-"+(item_date.getMonth()+1)

      current_month = @dashboardModel.monthlyallowances.get(item_str)

      if current_month is undefined
        current_month = @dashboardModel.monthlyallowances.get("STATE").clone()
        current_month.set { id: item_str }

      current_month.updateHousehold item.bytes

      console.log item

      current_month.updateDevice item.ipaddr, item.bytes

      if current_month.devices.get(item.ipaddr).has("user")
        current_month.updateUser device_state.get("user"), item.bytes

      if not @dashboardModel.monthlyallowances.get(item_str)
        @dashboardModel.monthlyallowances.add(current_month)

    console.log item_str

    return @dashboardModel.monthlyallowances.get(item_str).xport()
  
exports.dashorm = DashORM
