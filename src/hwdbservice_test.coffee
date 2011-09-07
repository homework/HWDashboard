nodeunit = require 'nodeunit'

exports['Testing tests'] = nodeunit.testCase
  'Run Test': (test) ->
         test.equal 'a', 'a'
         test.done()
