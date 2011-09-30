class StateBuilder

  user_state =

    ip:
                "1.1.1.4":
                  user: "uid1"
                  mac:  "11:22:33:44:55:66"
                "1.1.1.7":
                  user: "uid2"
                  mac:  "44:55:66:77:88:99"

    household:
                usage:        0
                allowance:    900000000000
    users:
                "uid1":
                  name:       "Mum Smith"
                  allowance:  500000000000

                "uid2":
                  name:       "Dad Smith"
                  allowance:  10000000000
                  
    devices:
                "11:22:33:44:55:66":
                  name:       "MacBook Pro"
                  allowance:  100000000000
                
                "44:55:66:77:88:99":
                  name:       "Mum-Laptop"
                  allowance:  65400000000

  dateQuery: (result) ->
    
    new_state = user_state

    new_state.users[user].usage = 0 for user of new_state.users
    new_state.devices[device].usage = 0 for device of new_state.devices

    for row in result

      if new_state.ip[row.ipaddr]?

        user = new_state.ip[row.ipaddr].user
        if new_state.users[user]?
          new_state.users[user].usage += parseInt(row.bytes)

        device = new_state.ip[row.ipaddr].mac
        if new_state.devices[device]?
          new_state.devices[device].usage += parseInt(row.bytes)

    return new_state

exports.statebuilder = new StateBuilder
