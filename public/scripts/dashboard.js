(function() {
  var socket, viewz;
  viewz = {};
  socket = io.connect();
  socket.on('updateView', function(model) {
    console.log("Got update");
    viewz.update(model);
    return viewz.render();
  });
  $j(document).ready(function() {
    var init;
    init = new models.MonthlyAllowance({
      id: "August-2011",
      usage: 40,
      allowance: 100
    });
    viewz = new DashboardViews.MonthlyAllowanceView({
      model: init,
      el: $j("#dashboard")
    });
    viewz.render();
    return setTimeout(function() {
      return socket.emit("cli", {
        str: "Ready boss"
      });
    }, 1000);
  });
}).call(this);
