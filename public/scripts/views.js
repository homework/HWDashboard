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
      return this.model.mport(m);
    },
    render: function() {
      var id_date, js;
      id_date = this.model.id.split("-");
      console.log(this.model);
      js = {
        month: id_date[0],
        year: id_date[1],
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
}).call(this);
