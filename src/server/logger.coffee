class HWDashboardLogger
  
  Log = require('log')
  fs  = require('fs')
  path = require('path')

  constructor: (@classlog, @loglevel) ->
    path.exists(__dirname + '/logs', (exist) ->
      if not exist
        fs.mkdir(__dirname + '/logs', '0755')
    )
    
    return log = new Log @loglevel, fs.createWriteStream(__dirname + '/logs/' + @classlog + '.log')
