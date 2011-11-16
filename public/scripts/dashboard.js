(function() {
  var client_stream, current_view;
  current_view = 0;
  client_stream = io.connect();
  $j(document).ready(function() {
    var base, current_date, params, path, slash;
    path = window.location.pathname.slice(1);
    slash = path.indexOf("/");
    if (slash !== -1) {
      base = path.slice(0, slash);
      return params = path.slice(slash + 1);
    } else {
      base = path;
      client_stream.emit("joinRoom", base, function() {
        return console.log("r");
      });
      client_stream.on('updateView', function(update) {
        switch (base) {
          case "allowances":
            if (current_view.model.id === update['id']) {
              return current_view.render(update['model']);
            }
            break;
          case "usage":
            return console.log("I don't exist");
        }
      });
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
      return $j.get("/" + base + "/" + params, function(data) {
        return current_view.render(data);
      });
    }
  });
  window.client_stream = client_stream;
}).call(this);
