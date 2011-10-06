(function() {
  var viewz;
  viewz = {};
  now.updateView = function(model) {
    viewz.update(model);
    return viewz.render();
  };
  now.ready(function() {
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
      return now.serverOutput("Ready boss");
    }, 1000);
  });
}).call(this);
