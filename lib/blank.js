(function() {
  var stats_jsrpc;
  stats_jsrpc = require('./jsrpc').jsrpc;
  stats_jsrpc.connect();
  stats_jsrpc.query("SQL:select * from Flows [range 600 seconds]");
  stats_jsrpc.on('message', function(data) {
    return console.log(data);
  });
  stats_jsrpc.on('timedout', function() {
    return process.exit(1);
  });
  if (!module.parent) {
    process.on('SIGINT', function() {
      stats_jsrpc.disconnect();
      return stats_jsrpc.on('disconnected', function() {
        return process.exit(0);
      });
    });
  }
}).call(this);
