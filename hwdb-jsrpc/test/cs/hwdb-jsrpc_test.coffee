testCase  = require('nodeunit').testCase
JSRPC     = require('../../lib/hwdb-jsrpc.min').jsrpc
jc        = new JSRPC()
RPCState  = jc.getRPCStates()
Command   = jc.getCommands()

exports['Tests from initial state'] = testCase({

  setUp : (callback) ->
    @jc_obj = new JSRPC()
    callback()

  test_initial : (test) ->
    test.equals(RPCState.IDLE, @jc_obj.getState())
    test.done()

  test_connect : (test) ->
    @jc_obj.connect()
    test.equals(RPCState.CONNECT_SENT, @jc_obj.getState())
    test.done()

  tearDown : (callback) ->
    callback()

})

#Test intToByteArray with even/odd hex and width paddings, max integer, low integer, out of range(width)
