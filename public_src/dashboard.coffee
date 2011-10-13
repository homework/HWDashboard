current_view = 0

socket = io.connect()

socket.on 'updateView', (model) ->
  console.log "Got update"
  current_view.render model

$j(document).ready( ->

  path = window.location.pathname.slice(1)
  slash = path.indexOf("/")

  if slash isnt -1
    base    = path.slice 0, slash
    params  = path.slice slash+1
  else
    base    = path

    #Default models/views
    switch base

      when "allowances"
        current_view = new DashboardViews.MonthlyAllowanceView(
          {
            model: new models.MonthlyAllowance()
          }
        )
        current_date = new Date()
        params = current_date.getFullYear() + "/" + (parseInt(current_date.getMonth()+1))
      when "usage"
        console.log "I don't exist"

  $j.get("/" + base + "/" + params, (data) ->
    console.log data
    current_view.render data
  )
)
