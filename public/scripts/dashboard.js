(function() {
  var updateBar;
  updateBar = function(id, bytes) {
    console.log("in1");
    if ($('#' + id + '_bar').length) {
      return $('#' + id + '_bar').width(bytes + "%");
    } else {
      console.log("not");
      return "if REST is user\n  get user info\n  add bar\nelse if REST is device\n  get device info\n  get user info\n  if user is selected\n    create bar under user\n  else\n    create bar under devices";
    }
  };
  now.statsUpdate = function(bytes) {
    console.log(bytes);
    if (1) {
      return updateBar("household", bytes);
    }
  };
  now.ready(function() {
    return now.serverOutput("Client connected through Now.JS");
  });
}).call(this);
