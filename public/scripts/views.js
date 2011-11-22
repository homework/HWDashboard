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
    HBS = Handlebars;
  }
  DashboardViews = this.DashboardViews = {};
  DashboardViews.MonthlyAllowanceView = BB.View.extend({
    getMonth: function(date) {
      return $j.get("/allowances/" + date.getFullYear() + "/" + parseInt(date.getMonth() + 1), __bind(function(data) {
        return this.render(data);
      }, this));
    },
    el: $j('#dashboard'),
    render: function(m) {
      var id_date, js;
      this.model = new models.MonthlyAllowance().mport(m);
      id_date = this.model.id.split("-");
      js = {
        month: id_date[1],
        year: id_date[0],
        household: this.model.household.toJSON(),
        users: this.model.users.toJSON(),
        devices: this.model.devices.toJSON()
      };
      return $j.get("/views/allowances.ejs", __bind(function(data) {
        var current_date, template;
        template = HBS.compile(data);
        $j("#dashboard").html(template(js));
        $j("#dashboard").show();
        $j("#prev").bind('click', __bind(function() {
          var prev_date;
          id_date = this.model.id.split("-");
          prev_date = new Date(id_date[0], id_date[1] - 2);
          return this.getMonth(prev_date);
        }, this));
        $j("#next").bind('click', __bind(function() {
          var next_date;
          id_date = this.model.id.split("-");
          next_date = new Date(id_date[0], id_date[1]);
          return this.getMonth(next_date);
        }, this));
        current_date = new Date();
        if (current_date.getUTCFullYear() === parseInt(id_date[0]) && (current_date.getUTCMonth() + 1) === parseInt(id_date[1])) {
          return $j("#next").css('visibility', 'hidden');
        } else {
          return $j("#next").css('visibility', 'visible');
        }
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
  HBS.registerHelper("toGigabytesAllowance", function(bytes) {
    var gb;
    gb = (Math.round(bytes / 1073741824 * 100000) / 100000).toFixed(2);
    if (gb !== "NaN") {
      if (gb !== -1) {
        return gb + "GB";
      } else {
        return "Unlimited";
      }
    } else {
      return "XX.XX";
    }
  });
  HBS.registerHelper("limitStyling", function(usage, allowance) {
    if ((usage !== "NaN" && usage >= 0) && (allowance !== "NaN" && allowance >= 0)) {
      if (usage >= allowance) {
        return "color:#d00000";
      }
    }
  });
  HBS.registerHelper("usagePercentage", function(usage, allowance) {
    var percent;
    percent = (usage / allowance) * 100;
    if (percent >= 100) {
      return "100%;background:url('/images/linen-red.jpg') repeat fixed;";
    } else {
      if (percent !== "NaN") {
        return percent;
      } else {
        return "0";
      }
    }
  });
  HBS.registerHelper("getMonth", function(month_no) {
    var months;
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[month_no - 1];
  });
  HBS.registerHelper("deviceIdentifier", function(device) {
    if (device.name != null) {
      return device.name;
    } else {
      return device.id;
    }
  });
}).call(this);
