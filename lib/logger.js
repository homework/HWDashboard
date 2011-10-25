(function() {
  var HWDashboardLogger;
  HWDashboardLogger = (function() {
    var Log, fs, path;
    Log = require('log');
    fs = require('fs');
    path = require('path');
    function HWDashboardLogger(classlog, loglevel) {
      var log;
      this.classlog = classlog;
      this.loglevel = loglevel;
      if (!(path.existsSync(__dirname + '/logs'))) {
        fs.mkdir(__dirname + '/logs', '0755');
      }
      return log = new Log(this.loglevel, fs.createWriteStream(__dirname + '/logs/' + this.classlog + '.log'));
    }
    return HWDashboardLogger;
  })();
  exports.logger = HWDashboardLogger;
}).call(this);
