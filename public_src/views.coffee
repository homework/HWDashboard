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
    @model.mport(m)
  render: () ->

    id_date = @model.id.split("-")
    console.log @model
    js =
      {
        month:      id_date[0]
        year:       id_date[1]
        household:  @model.household.toJSON()
        users:      @model.users.toJSON()
        devices:    @model.devices.toJSON()
      }
    $j.get("/views/allowances.ejs", (data) ->
      template = HBS.compile data
      $j("#dashboard").html(template(js))
    )
})
