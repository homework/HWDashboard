(function() {
  var nodeunit;
  nodeunit = require('nodeunit');
  exports['Testing tests'] = nodeunit.testCase({
    'Run Test': function(test) {
      test.equal('a', 'a');
      return test.done();
    }
  });
}).call(this);
