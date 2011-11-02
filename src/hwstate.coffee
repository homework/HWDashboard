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

  updateState: (callback) ->

    @updateDeviceNames( =>
      console.log "devices"
      setTimeout( =>
        @updateUsers( =>
          console.log "users"
          setTimeout( =>
            @updateAllowances( =>
              console.log "allowances"
              callback(@state)
            )
          ,1000)
          )
      ,1000)
    )

  updateDeviceNames: (callback) ->
    
    @hwdb.once 'message', (device_rows) =>

      if device_rows[0].status is "Success" and device_rows[0].rows > 0
        for device_row in device_rows.slice(1)

          @state.updateDevice device_row.ip, 0, 0, device_row.name
      
      if callback then callback() else @emit 'state', @state
 
    @hwdb.query("SQL:select * from DeviceNames")

  updateUsers: (callback) ->

    @hwdb.once 'message', (user_rows) =>

      if user_rows[0].status is "Success" and user_rows[0].rows > 0
        for user_row in user_rows.slice(1)

          @state.updateDevice user_row.ip, 0, 0, undefined, user_row.name
      
      if callback then callback() else @emit 'state', @state

    @hwdb.query("SQL:select * from Users")

  updateAllowances: (callback) ->

    @hwdb.once 'message', (allowance_rows) =>

      if allowance_rows[0].status is "Success" and allowance_rows[0].rows > 0
        for allowance_row in allowance_rows.slice(1)

          if allowance_row.ip is "HOME"
            @state.updateHousehold 0, allowance_row.allowance
          else
            @state.updateDevice allowance_row.ip, 0, allowance_row.allowance

      if callback then callback() else @emit 'state', @state

    @hwdb.query("SQL:select * from Allowances")

exports.hwstate = HWState
