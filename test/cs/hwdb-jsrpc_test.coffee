testCase  = require('nodeunit').testCase
jc     = require('../../lib/jsrpc').jsrpc
#jc        = new JSRPC()
RPCState  = jc.getRPCStates()
Command   = jc.getCommands()

exports['Tests from initial state'] = testCase({

  setUp : (callback) ->
    callback()

  test_initial : (test) ->
    test.equals(RPCState.IDLE, jc.getState())
    test.done()

  test_connect : (test) ->
    jc.connect()
    test.equals(RPCState.CONNECT_SENT, jc.getState())
    test.done()

  tearDown : (callback) ->
    callback()

})
#Test intToByteArray with even/odd hex and width paddings, max integer, low integer, out of range(width)
