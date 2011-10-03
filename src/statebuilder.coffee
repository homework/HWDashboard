class StateBuilder

  parseResult: (result, state=0, start=0, end=0) ->

    new_state = 0
    
    if state
      new_state = state
    else
      new_state =
        household:
          usage: 0
          allowance: 900000000 # TODO
        devices: {}

    new_state.users[user].usage = 0 for user of new_state.users
    new_state.devices[device].usage = 0 for device of new_state.devices

    for row in result
      console.log row

      #TODO check if within date range
      device = row.ipaddr
      if new_state.devices[device]?
        new_state.devices[device].usage += parseInt(row.bytes)
      else
        new_state.devices[device] =
          #name:       row.name
          usage:      parseInt(row.bytes)
          allowance:  500000,#parseInt(row.allowance)
      new_state.household.usage += parseInt(row.bytes)

    return new_state

exports.statebuilder = new StateBuilder
