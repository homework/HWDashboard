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

  el: $j('#dashboard')

  render: (m) ->
    @model = new models.MonthlyAllowance().mport(m)
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

    $j.get("/views/allowances.ejs", (data) =>
      template = HBS.compile data
      $j("#dashboard").html(template(js))

      $j("#prev").bind('click', () =>
        id_date = @model.id.split("-")
        prev_date = new Date(id_date[0], id_date[1]-2)
        $j.get("/allowances/" + prev_date.getFullYear() + "/" + parseInt(prev_date.getMonth()+1), (data) =>
          @render data
        )
      )

      $j("#next").bind('click', () =>
        id_date = @model.id.split("-")
        next_date = new Date(id_date[0], id_date[1])
        $j.get("/allowances/" + next_date.getFullYear() + "/" + parseInt(next_date.getMonth()+1), (data) =>
          @render data
        )
      )
    )
})

DashboardViews.DayUsageView = BB.View.extend({

  el: $j('#usage_panel')

  render: (m) ->
    console.log "Usage render NYI"

})

HBS.registerHelper("toGigabytes", (bytes) ->
  gb = (Math.round(bytes/1073741824*100000)/100000).toFixed(2)
  return (if gb isnt "NaN" then gb else "XX.XX")
)

HBS.registerHelper("usagePercentage", (usage, allowance) ->
  percent = (usage / allowance) * 100
  if percent > 100
    return 100
  else
    return (if percent isnt "NaN" then percent else "XX.XX")
)

HBS.registerHelper("getMonth", (month_no) ->
  months = ["January", "February", "March", "April", "May",
            "June", "July", "August", "September", "October",
            "November", "December"]
  return months[month_no-1]
)
