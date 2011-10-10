(function() {
  var $j, BB, DashboardViews, HBS, __;
  if (typeof exports !== 'undefined') {
    __ = require('underscore')._;
    $j = require('jquery');
    BB = require('backbone');
    HBS = require('hbs');
  } else {
    BB = Backbone;
    $j = jQuery.noConflict();
    __ = _;
    HBS = Handlebars;
  }
  DashboardViews = this.DashboardViews = {};
  DashboardViews.MonthlyAllowanceView = BB.View.extend({
    update: function(m) {
      return this.model = new models.MonthlyAllowance().mport(m);
    },
    render: function() {
      var id_date, js;
      id_date = this.model.id.split("/");
      console.log(this.model);
      js = {
        month: id_date[1],
        year: id_date[0],
        household: this.model.household.toJSON(),
        users: this.model.users.toJSON(),
        devices: this.model.devices.toJSON()
      };
      return $j.get("/views/allowances.ejs", function(data) {
        var template;
        template = HBS.compile(data);
        return $j("#dashboard").html(template(js));
      });
    }
  });
  HBS.registerHelper("toGigabytes", function(bytes) {
    var gb;
    gb = (Math.round(bytes / 1073741824 * 100000) / 100000).toFixed(2);
    if (gb !== "NaN") {
      return gb;
    } else {
      return "XX.XX";
    }
  });
  HBS.registerHelper("usagePercentage", function(usage, allowance) {
    var percent;
    percent = (usage / allowance) * 100;
    if (percent !== "NaN") {
      return percent;
    } else {
      return "XX.XX";
    }
  });
  HBS.registerHelper("getMonth", function(month_no) {
    var months;
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[month_no - 1];
  });
}).call(this);
