(function() {
  var current_view, socket;
  current_view = 0;
  socket = io.connect();
  socket.on('updateView', function(model) {
    console.log("Got update");
    return current_view.render(model);
  });
  $j(document).ready(function() {
    var base, current_date, params, path, slash;
    path = window.location.pathname.slice(1);
    slash = path.indexOf("/");
    if (slash !== -1) {
      base = path.slice(0, slash);
      params = path.slice(slash + 1);
    } else {
      base = path;
      switch (base) {
        case "allowances":
          current_view = new DashboardViews.MonthlyAllowanceView({
            model: new models.MonthlyAllowance()
          });
          current_date = new Date();
          params = current_date.getFullYear() + "/" + (parseInt(current_date.getMonth() + 1));
          break;
        case "usage":
          console.log("I don't exist");
      }
    }
    return $j.get("/" + base + "/" + params, function(data) {
      return current_view.render(data);
    });
  });
}).call(this);
