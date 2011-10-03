(function() {
  var StateBuilder;
  StateBuilder = (function() {
    function StateBuilder() {}
    StateBuilder.prototype.parseResult = function(result, state, start, end) {
      var device, new_state, row, user, _i, _len;
      if (state == null) {
        state = 0;
      }
      if (start == null) {
        start = 0;
      }
      if (end == null) {
        end = 0;
      }
      new_state = 0;
      if (state) {
        new_state = state;
      } else {
        new_state = {
          household: {
            usage: 0,
            allowance: 900000000
          },
          devices: {}
        };
      }
      for (user in new_state.users) {
        new_state.users[user].usage = 0;
      }
      for (device in new_state.devices) {
        new_state.devices[device].usage = 0;
      }
      for (_i = 0, _len = result.length; _i < _len; _i++) {
        row = result[_i];
        console.log(row);
        device = row.ipaddr;
        if (new_state.devices[device] != null) {
          new_state.devices[device].usage += parseInt(row.bytes);
        } else {
          new_state.devices[device] = {
            usage: parseInt(row.bytes),
            allowance: 500000
          };
        }
        new_state.household.usage += parseInt(row.bytes);
      }
      return new_state;
    };
    return StateBuilder;
  })();
  exports.statebuilder = new StateBuilder;
}).call(this);
