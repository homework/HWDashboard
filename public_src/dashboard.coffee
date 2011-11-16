current_view = 0

client_stream = io.connect()

$j(document).ready( ->

  path = window.location.pathname.slice(1)
  slash = path.indexOf("/")

  if slash isnt -1
    base    = path.slice 0, slash
    params  = path.slice slash+1
  else
    base    = path

    client_stream.emit "joinRoom", base, ->
      console.log "r"

    #Model constraints
    client_stream.on 'updateView', (update) ->

      switch base

        when "allowances"
          if current_view.model.id is update['id']
            current_view.render update['model']

        when "usage"
          console.log "I don't exist"

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
      current_view.render data
    )
)

window.client_stream = client_stream
