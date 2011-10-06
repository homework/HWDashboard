viewz = {}
now.updateView = (model) ->
  viewz.update(model)
  viewz.render()

now.ready ->
  init = new models.MonthlyAllowance({ id: "August-2011", usage: 40, allowance: 100})
  viewz = new DashboardViews.MonthlyAllowanceView({model: init, el: $j("#dashboard")})
  viewz.render()
  setTimeout( ->
    now.serverOutput "Ready boss"
  ,1000)
