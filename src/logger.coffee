class HWDashboardLogger
  
  Log = require('log')
  fs  = require('fs')
  path = require('path')

  constructor: (@classlog, @loglevel) ->
    if !(path.existsSync(__dirname + '/logs'))
      fs.mkdir(__dirname + '/logs', '0755')
    
    return log = new Log @loglevel, fs.createWriteStream(__dirname + '/logs/' + @classlog + '.log')

exports.logger = HWDashboardLogger
