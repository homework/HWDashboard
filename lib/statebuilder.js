(function() {
  var StateBuilder;
  StateBuilder = (function() {
    var user_state;
    function StateBuilder() {}
    user_state = {
      ip: {
        "1.1.1.4": {
          user: "uid1",
          mac: "11:22:33:44:55:66"
        },
        "1.1.1.7": {
          user: "uid2",
          mac: "44:55:66:77:88:99"
        }
      },
      household: {
        usage: 0,
        allowance: 900000000000
      },
      users: {
        "uid1": {
          name: "Mum Smith",
          allowance: 500000000000
        },
        "uid2": {
          name: "Dad Smith",
          allowance: 10000000000
        }
      },
      devices: {
        "11:22:33:44:55:66": {
          name: "MacBook Pro",
          allowance: 100000000000
        },
        "44:55:66:77:88:99": {
          name: "Mum-Laptop",
          allowance: 65400000000
        }
      }
    };
    StateBuilder.prototype.dateQuery = function(result) {
      var device, new_state, row, user, _i, _len;
      new_state = user_state;
      for (user in new_state.users) {
        new_state.users[user].usage = 0;
      }
      for (device in new_state.devices) {
        new_state.devices[device].usage = 0;
      }
      for (_i = 0, _len = result.length; _i < _len; _i++) {
        row = result[_i];
        if (new_state.ip[row.ipaddr] != null) {
          user = new_state.ip[row.ipaddr].user;
          if (new_state.users[user] != null) {
            new_state.users[user].usage += parseInt(row.bytes);
          }
          device = new_state.ip[row.ipaddr].mac;
          if (new_state.devices[device] != null) {
            new_state.devices[device].usage += parseInt(row.bytes);
          }
        }
      }
      return new_state;
    };
    return StateBuilder;
  })();
  exports.statebuilder = new StateBuilder;
}).call(this);
