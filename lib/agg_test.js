(function() {
  var Aggregator, aggregator;
  Aggregator = require('./aggregator').aggregator;
  aggregator = new Aggregator;
  process.on('SIGINT', function() {
    aggregator.destroy();
    return setTimeout(function() {
      return process.exit(0);
    }, 5000);
  });
}).call(this);
