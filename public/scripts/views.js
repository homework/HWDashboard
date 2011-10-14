(function() {
  var $j, BB, DashboardViews, HBS, __;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
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
    el: $j('#dashboard'),
    render: function(m) {
      var id_date, js;
      this.model = new models.MonthlyAllowance().mport(m);
      id_date = this.model.id.split("-");
      console.log(this.model.devices);
      js = {
        month: id_date[1],
        year: id_date[0],
        household: this.model.household.toJSON(),
        users: this.model.users.toJSON(),
        devices: this.model.devices.toJSON()
      };
      return $j.get("/views/allowances.ejs", __bind(function(data) {
        var template;
        template = HBS.compile(data);
        $j("#dashboard").html(template(js));
        $j("#prev").bind('click', __bind(function() {
          var prev_date;
          id_date = this.model.id.split("-");
          prev_date = new Date(id_date[0], id_date[1] - 2);
          return $j.get("/allowances/" + prev_date.getFullYear() + "/" + parseInt(prev_date.getMonth() + 1), __bind(function(data) {
            return this.render(data);
          }, this));
        }, this));
        return $j("#next").bind('click', __bind(function() {
          var next_date;
          id_date = this.model.id.split("-");
          next_date = new Date(id_date[0], id_date[1]);
          return $j.get("/allowances/" + next_date.getFullYear() + "/" + parseInt(next_date.getMonth() + 1), __bind(function(data) {
            return this.render(data);
          }, this));
        }, this));
      }, this));
    }
  });
  DashboardViews.DayUsageView = BB.View.extend({
    el: $j('#usage_panel'),
    render: function(m) {
      return console.log("Usage render NYI");
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
    if (percent > 100) {
      return 100;
    } else {
      if (percent !== "NaN") {
        return percent;
      } else {
        return "XX.XX";
      }
    }
  });
  HBS.registerHelper("getMonth", function(month_no) {
    var months;
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[month_no - 1];
  });
}).call(this);
