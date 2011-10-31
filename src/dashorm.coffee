MYSQL_HOST      = 'localhost'
MYSQL_PORT      = 3306
MYSQL_USERNAME  = 'homework'
MYSQL_PASSWORD  = 'whatever'
MYSQL_DATABASE  = 'bandwidth_data'

JSRPC = require('./jsrpc').jsrpc

models       = require('../public/scripts/models').models
mysqlLib     = require('mysql')

class DashORM
  
  constructor: ->

    @hwdb = new JSRPC("127.0.0.1", 987)

    @hwdb.connect()
    #once 'connected'
    @dashboardModel = new models.DashboardModel()
    #@dashboardModel.populateTestData()
 
    @mysql = mysqlLib.createClient({
      host:       MYSQL_HOST
      port:       MYSQL_PORT
      user:       MYSQL_USERNAME
      password:   MYSQL_PASSWORD
    })

    @mysql.useDatabase MYSQL_DATABASE

    @ip_allowances    = {}
    @user_allowances  = {}
    @devices          = {}
    @users            = {}

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
            if response then response.json @dashboardModel.monthlyallowances.get(month_str).xport() else return response.json @dashboardModel.monthlyallowances.get(month_str).xport()
            return

        ma = new models.MonthlyAllowance(
              { id: month_str }
        )

        @ip_usage = {}
        
        @hwdb.query("SQL:select * from DeviceNames")
        @hwdb.once 'message', (device_rows) =>

          if device_rows[0].status is "Success" and device_rows[0].rows > 0
            for device_row in device_rows.slice(1)
              @devices[device_row.ip] = device_row.name

          console.log "Collected device names "

          setTimeout( =>
            @hwdb.query("SQL:select * from Users")
            @hwdb.once 'message', (hw_rows) =>

              if hw_rows[0].status is "Success" and hw_rows[0].rows > 0
                for hw_row in hw_rows.slice(1)
                  @users[hw_row.ip] = hw_row.name

              console.log "Collected user information."
           
              setTimeout( =>
                @hwdb.once 'message', (hw_rows) =>

                  if hw_rows[0].status is "Success" and hw_rows[0].rows > 0

                    @ip_allowances    = {}
                    @user_allowances  = {}

                    for hw_row in hw_rows.slice(1)

                      @ip_allowances[hw_row.ip] = parseInt(hw_row.allowance)

                      if @users[hw_row.ip]?

                        if @user_allowances[ @users[hw_row.ip] ]?
                          @user_allowances[ @users[hw_row.ip] ] += parseInt(hw_row.allowance)
                        else
                          @user_allowances[ @users[hw_row.ip] ] = parseInt(hw_row.allowance)

                  console.log "Collected allowances information."

                  month_totals = @mysql.query(
                    "SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " +
                    "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip",
                    [date_string, date_string]
                  )

                  month_totals.on 'row', (mysql_row) =>

                    if mysql_row.ip isnt '0.0.0.0'

                      user = @users[mysql_row.ip]

                      if @ip_allowances[mysql_row.ip]?
                        ip_allowance = @ip_allowances[mysql_row.ip]
                      else
                        ip_allowance = -1

                      ma.users.add(
                        new models.Allowance(
                          {
                            id:         @users[mysql_row.ip]
                            usage:      parseInt(mysql_row['SUM(bytes)'])
                            allowance:  ip_allowance
                          }
                        )
                      )

                      ma.devices.add(
                        new models.Allowance(
                          {
                            id:         (@devices[mysql_row.ip] || mysql_row.ip)
                            usage:      parseInt(mysql_row['SUM(bytes)'])
                            allowance:  parseInt(ip_allowance)
                          }
                        )
                      )

                      current_household_usage = ma.household.get("usage")

                      ma.household.set(
                        { usage: parseInt(current_household_usage) + parseInt(mysql_row['SUM(bytes)']) }
                      )

                  month_totals.on 'end', (result) =>

                    ma.household.set({ allowance: @ip_allowances['HOME'] })

                @hwdb.query("SQL:select * from Allowances")
              ,2000
              )
          ,2000
          )

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

        user = @users[item.ipaddr]

        if user
          user_model  = month_model.users.get(user)
         
          if user_model
            user_model.set( { usage: parseInt(user_model.get("usage")) + parseInt(item.bytes) } )
          else
            user_total_usage = 0

            month_model.devices.each( (device) =>
              if @users[device.id] is user
                user_total_usage += device.get("usage")
            )

            month_model.users.add(
              new models.Allowance(
                {
                  id:         user
                  usage:      user_total_usage
                  allowance:  @user_allowances[user]
                }
              )
            )

        if month_model.devices.get(@devices[item.ipaddr])?
          device = month_model.devices.get(@devices[item.ipaddr])
        else
          device = month_model.devices.get(item.ipaddr)

        if device
          device.set( { usage: parseInt(device.get("usage")) + parseInt(item.bytes) } )
        else
          month_model.devices.add(
            new models.Allowance(
              {
                id:         (@devices[item.ipaddr] || item.ipaddr)
                usage:      parseInt(@ip_usage[item.ipaddr] || 0) + parseInt(item.bytes)
                allowance:  parseInt(@ip_allowances[item.ipaddr])
              }
            )
          )

    if month_model isnt undefined
      return @dashboardModel.monthlyallowances.get(item_str).xport()
  
  updateORMState: () ->


exports.dashorm = DashORM
