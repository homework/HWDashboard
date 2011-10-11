if(typeof exports isnt 'undefined')
  __ = require('underscore')._
  $j = require('jquery')
  BB = require('backbone')
  HBS = require('hbs')
else
  BB = Backbone
  $j = jQuery.noConflict()
  __ = _
  HBS = Handlebars

DashboardViews = this.DashboardViews = {}

DashboardViews.MonthlyAllowanceView = BB.View.extend({

  update: (m) ->
    @model = new models.MonthlyAllowance().mport(m)
  render: () ->

    id_date = @model.id.split("-")
    console.log @model.devices
    js =
      {
        month:      id_date[1]
        year:       id_date[0]
        household:  @model.household.toJSON()
        users:      @model.users.toJSON()
        devices:    @model.devices.toJSON()
      }
    $j.get("/views/allowances.ejs", (data) ->
      template = HBS.compile data
      $j("#dashboard").html(template(js))
    )
})

HBS.registerHelper("toGigabytes", (bytes) ->
  gb = (Math.round(bytes/1073741824*100000)/100000).toFixed(2)
  return (if gb isnt "NaN" then gb else "XX.XX")
)

HBS.registerHelper("usagePercentage", (usage, allowance) ->
  percent = (usage / allowance) * 100
  return (if percent isnt "NaN" then percent else "XX.XX")
)

HBS.registerHelper("getMonth", (month_no) ->
  months = ["January", "February", "March", "April", "May",
            "June", "July", "August", "September", "October",
            "November", "December"]
  return months[month_no-1]
)
