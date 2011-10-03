(function() {
  var toGigabytes, updateDevice, updateHousehold, updateUser;
  toGigabytes = function(bytes) {
    return (Math.round(bytes / 1073741824 * 100000) / 100000).toFixed(2);
  };
  updateHousehold = function(hh) {
    var hh_allowance, hh_usage, percent_usage;
    hh_usage = toGigabytes(hh.usage);
    hh_allowance = toGigabytes(hh.allowance);
    percent_usage = (hh_usage / hh_allowance) * 100;
    $('#household_container_right .household_bar').width(percent_usage + "%");
    $('#household_usage').text(hh_usage);
    return $('#household_allowance').text(hh_allowance + "GB");
  };
  updateUser = function(user) {
    var percent_usage, user_allowance, user_usage;
    user_usage = toGigabytes(user.usage);
    user_allowance = toGigabytes(user.allowance);
    percent_usage = (user.usage / user.allowance) * 100;
    if ($('#user-' + user.id + '_container_left .user_bar').length === 0) {
      $('#user_container_left').append('\
      <div id="' + user.id + '_container_left" class="dashboard_user dashboard_left">\
        <div class="dashboard_user_text">' + user.name + '</div>\
      </div>\
    ');
      $('#user_container_right').append('\
      <div id="user-' + user.id + '_container_right" class="dashboard_user dashboard_right">\
        <div class="user_bar_border">                     \
          <div class="user_bar">                          \
          </div>                                            \
        </div>\
        <div class="bar_text">                           \
          <sup id="user-' + user.id + '_usage"></sup>                                  \
          /\
          <sub id="user-' + user.id + '_allowance"></sub>                                \
        </div>\
      </div>\
    ');
    }
    $('#user-' + user.id + '_container_right .user_bar').width(percent_usage + '%');
    $('#user-' + user.id + '_usage').text(user_usage);
    return $('#user-' + user.id + '_allowance').text(user_allowance + 'GB');
  };
  updateDevice = function(mac, device) {
    var device_allowance, device_usage, percent_usage;
    device_usage = toGigabytes(device.usage);
    device_allowance = toGigabytes(device.allowance);
    percent_usage = (device.usage / device.allowance) * 100;
    if ($('#device-' + device.name + '_container_left .device_bar').length === 0) {
      $('#device_container_left').append('\
      <div id="' + device.name + '_container_left" class="dashboard_device dashboard_left">\
        <div class="dashboard_device_text">' + device.name + '</div>\
      </div>\
    ');
      $('#device_container_right').append('\
      <div id="device-' + device.name + '_container_right" class="dashboard_device dashboard_right">\
        <div class="device_bar_border">                     \
          <div class="device_bar">                          \
          </div>                                            \
        </div>\
        <div class="bar_text">                           \
          <sup id="device-' + device.name + '_usage"></sup>                                  \
          /\
          <sub id="device-' + device.name + '_allowance"></sub>                                \
        </div>\
      </div>\
    ');
    }
    $('#device-' + device.name + '_container_right .device_bar').width(percent_usage + '%');
    $('#device-' + device.name + '_usage').text(device_usage);
    return $('#device-' + device.name + '_allowance').text(device_allowance + 'GB');
  };
  now.updateView = function(state) {
    var device, mac, _ref, _results;
    updateHousehold(state.household);
    _ref = state.devices;
    _results = [];
    for (mac in _ref) {
      device = _ref[mac];
      _results.push(updateDevice(mac, device));
    }
    return _results;
  };
  now.ready(function() {
    return now.serverOutput("Client connected through Now.JS");
  });
}).call(this);
