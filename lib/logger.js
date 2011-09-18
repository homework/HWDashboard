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
      path.exists(__dirname + '/logs', function(exist) {
        if (!exist) {
          return fs.mkdir(__dirname + '/logs', '0755');
        }
      });
      return log = new Log(this.loglevel, fs.createWriteStream(__dirname + '/logs/' + this.classlog + '.log'));
    }
    return HWDashboardLogger;
  })();
  exports.logger = HWDashboardLogger;
}).call(this);
