(function() {
  var updateBar;
  updateBar = function(subject_id, bytes) {
    var update_subject;
    update_subject = subject_id.split('-');
    if ($('#' + subject_id + '_container_left .' + update_subject[0] + '_bar').length === 0) {
      console.log(update_subject);
      $('#' + update_subject[0] + '_container_left').append('\
      <div id="' + subject_id + '_container_left" class="dashboard_user dashboard_user_left">' + update_subject[1] + '</div>\
    ');
      $('#' + update_subject[0] + '_container_right').append('\
      <div id="' + subject_id + '_container_right" class="dashboard_user dashboard_right">\
        <div class="' + update_subject[0] + '_bar_border">                     \
          <div class="' + update_subject[0] + '_bar">                          \
          </div>                                            \
        </div>\
        <div class="household_text">                           \
          <sup>10.53</sup>                                  \
          /\
          <sub>50.00GB</sub>                                \
        </div>\
      </div>\
    ');
    }
    return $('#' + subject_id + '_container_right .' + update_subject[0] + '_bar').width(bytes + "%");
  };
  now.statsUpdate = function(bytes) {
    console.log(bytes);
    if (1) {
      return updateBar("user-" + bytes, bytes);
    }
  };
  now.ready(function() {
    return now.serverOutput("Client connected through Now.JS");
  });
}).call(this);
