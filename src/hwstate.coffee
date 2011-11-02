EventEmitter = require('events').EventEmitter

JSRPC = require('./jsrpc').jsrpc
BB = require('backbone')

models = require('../public/scripts/models').models

class HWState extends EventEmitter

  constructor: (callback) ->

    @state = new models.MonthlyAllowance(
              { id: "STATE" }
    )

    @hwdb = new JSRPC("127.0.0.1", 987)

    @hwdb.connect()

    @hwdb.once 'connected', =>
      @updateState(callback)

  getState: ->
    @state

  updateState: (callback) ->

    @updateDeviceNames( =>
      console.log "devices"
      setTimeout( =>
        @updateUsers( =>
          console.log "users"
          console.log "TT " + @state.devices.get("1.1.1.7").has("user")
          setTimeout( =>
            @updateAllowances( =>
              console.log "allowances"
              console.log @state.devices.get("1.1.1.7").has("user")
              @emit 'update', @state
            )
          ,2000)
          )
      ,2000)
      callback(@state)
    )

  updateDeviceNames: (callback) ->
    
    @hwdb.once 'message', (device_rows) =>

      if device_rows[0].status is "Success" and device_rows[0].rows > 0
        for device_row in device_rows.slice(1)
          console.log device_row

          if @state.devices[device_row.ip]?
            @state.devices[device_row.ip].set({ name: device_row.name })
          else
            @state.devices.add(
              new models.Allowance(
                {
                  id:   device_row.ip
                  name: device_row.name
                }
              )
            )
      
      if callback then callback() else @emit 'state', @state
 
    @hwdb.query("SQL:select * from DeviceNames")

  updateUsers: (callback) ->

    @hwdb.once 'message', (user_rows) =>

      if user_rows[0].status is "Success" and user_rows[0].rows > 0
        for user_row in user_rows.slice(1)

          if @state.devices.get(user_row.ip)?
            console.log "Device exists"
            @state.devices.get(user_row.ip).set({ user: user_row.name })
            console.log user_row.ip, @state.devices.get(user_row.ip).has("user")
          else
            console.log "Device does not exist, adding"
            @state.devices.add(
              new models.Allowance(
                {
                  id:   user_row.ip
                  user: user_row.name
                }
              )
            )
      
      if callback then callback() else @emit 'state', @state

    @hwdb.query("SQL:select * from Users")

  updateAllowances: (callback) ->

    @hwdb.once 'message', (allowance_rows) =>

      if allowance_rows[0].status is "Success" and allowance_rows[0].rows > 0
        for allowance_row in allowance_rows.slice(1)

          console.log "Allowance IP: " + allowance_row.ip

          if @state.devices.get(allowance_row.ip)?
            console.log "Setting"
            @state.devices.get(allowance_row.ip).set({ allowance: parseInt(allowance_row.allowance) })
          else
            console.log "Adding"
            @state.devices.add(
              new models.Allowance(
                {
                  id:         allowance_row.ip
                  allowance:  allowance_row.allowance
                }
              )
            )

      if callback then callback() else @emit 'state', @state

    @hwdb.query("SQL:select * from Allowances")

exports.hwstate = HWState
