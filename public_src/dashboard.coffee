viewz = {}

socket = io.connect()

socket.on 'updateView', (model) ->
  console.log "Got update"
  viewz.update(model)
  viewz.render()

$j(document).ready( ->
  init = new models.MonthlyAllowance({ id: "August-2011", usage: 40, allowance: 100})
  viewz = new DashboardViews.MonthlyAllowanceView({model: init, el: $j("#dashboard")})
  viewz.render()
  setTimeout( ->
    socket.emit "cli", { str: "Ready boss" }
  ,1000)
)
