updateBar = (subject_id, bytes) ->

  update_subject = subject_id.split('-')

  if $('#' + subject_id + '_container_left .' + update_subject[0] + '_bar').length is 0
    console.log update_subject

    $('#' + update_subject[0] + '_container_left').append('
      <div id="' + subject_id + '_container_left" class="dashboard_user dashboard_user_left">' + update_subject[1] + '</div>
    ')

    $('#' + update_subject[0] + '_container_right').append('
      <div id="' + subject_id + '_container_right" class="dashboard_user dashboard_right">
        <div class="' + update_subject[0] + '_bar_border">                     
          <div class="' + update_subject[0] + '_bar">                          
          </div>                                            
        </div>
        <div class="household_text">                           
          <sup>10.53</sup>                                  
          /
          <sub>50.00GB</sub>                                
        </div>
      </div>
    ')
  $('#' + subject_id + '_container_right .' + update_subject[0] + '_bar').width(bytes + "%")

now.statsUpdate = (bytes) ->
  console.log bytes
  if 1#REST in window
    updateBar("user-" + bytes, bytes)

now.ready ->
  now.serverOutput "Client connected through Now.JS"
