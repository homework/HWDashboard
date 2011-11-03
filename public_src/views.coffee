if(typeof exports isnt 'undefined')
  __ = require('underscore')._
  $j = require('jquery')
  BB = require('backbone')
  HBS = require('hbs')
else
  BB = Backbone
  $j = jQuery.noConflict()
#  __ = _
  HBS = Handlebars

DashboardViews = this.DashboardViews = {}

DashboardViews.MonthlyAllowanceView = BB.View.extend({

  getMonth: (date) ->

    $j.get("/allowances/" + date.getFullYear() + "/" + parseInt(date.getMonth()+1), (data) =>
      @render data
    )

  el: $j('#dashboard')

  render: (m) ->

    @model = new models.MonthlyAllowance().mport(m)
    id_date = @model.id.split("-")

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

      $j("#prev").bind('click', =>
        id_date = @model.id.split("-")
        prev_date = new Date(id_date[0], id_date[1]-2)

        @getMonth(prev_date)
      )

      $j("#next").bind('click', () =>
        id_date = @model.id.split("-")
        next_date = new Date(id_date[0], id_date[1])

        @getMonth(next_date)
      )

      #$j(".hw_sub_title").bind

      current_date = new Date()

      if current_date.getUTCFullYear() is parseInt(id_date[0]) and (current_date.getUTCMonth()+1) is parseInt(id_date[1])
        $j("#next").css('visibility', 'hidden')
      else
        $j("#next").css('visibility', 'visible')
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

HBS.registerHelper("toGigabytesAllowance", (bytes) ->
  gb = (Math.round(bytes/1073741824*100000)/100000).toFixed(2)
  return (if gb isnt "NaN" then (if gb isnt -1 then (gb+"GB") else "Unlimited") else "XX.XX")
)

HBS.registerHelper("limitStyling", (usage, allowance) ->
  console.log usage, allowance
  if (usage isnt "NaN" and usage >= 0) and (allowance isnt "NaN" and allowance >= 0)
    if usage >= allowance
      return "color:#d00000"
)

HBS.registerHelper("usagePercentage", (usage, allowance) ->
  percent = (usage / allowance) * 100
  if percent >= 100
    return "100%;background:url('/images/linen-red.jpg') repeat fixed;"
  else
    return (if percent isnt "NaN" then percent else "0")
)

HBS.registerHelper("getMonth", (month_no) ->
  months = ["January", "February", "March", "April", "May",
            "June", "July", "August", "September", "October",
            "November", "December"]
  return months[month_no-1]
)

HBS.registerHelper("deviceIdentifier", (device) ->

  if device.name?
    return device.name
  else
    return device.id
)
