testCase  = require('nodeunit').testCase
jc = require('../../lib/jsrpc').jsrpc
jc.connect()
jc.query("SQL:subscribe SysLast 192.168.1.78 ")

