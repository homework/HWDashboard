(function() {
  var stats_jsrpc;
  stats_jsrpc = require('./jsrpc').jsrpc;
  stats_jsrpc.connect();
  stats_jsrpc.query("SQL:select * from Flows INTERVAL (124a2745759fe820, 124a274575a53780)");
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
