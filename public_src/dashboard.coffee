updateBar = (id, bytes) ->
  console.log "in1"

  if $('#' + id + '_bar').length#bar exists
    $('#' + id + '_bar').width(bytes + "%")
    
  else
    console.log "not"
    """
    if REST is user
      get user info
      add bar
    else if REST is device
      get device info
      get user info
      if user is selected
        create bar under user
      else
        create bar under devices
    """
now.statsUpdate = (bytes) ->
  console.log bytes
  if 1#REST in window
    updateBar("household", bytes)

now.ready ->
  now.serverOutput "Client connected through Now.JS"
