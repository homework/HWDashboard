pktr = require('./packeteer').packeteer

class JSRPC

  Command = 
    ERROR       : 0,
    CONNECT     : 1,
    CACK        : 2,
    QUERY       : 3,
    QACK        : 4,
    RESPONSE    : 5,
    RACK        : 6,
    DISCONNECT  : 7,
    DACK        : 8,
    FRAGMENT    : 9,
    FACK        : 10,
    PING        : 11,
    PACK        : 12,
    SEQNO       : 13,
    SACK        : 14

  RPCState =
    IDLE              : 0,
    QACK_SENT         : 1,
    RESPONSE_SENT     : 2,
    CONNECT_SENT      : 3,
    QUERY_SENT        : 4,
    AWAITING_RESPONSE : 5,
    TIMEDOUT          : 6,
    DISCONNECT_SENT   : 7,
    FRAGMENT_SENT     : 8,
    FACK_RECEIVED     : 9,
    FRAGMENT_RECEIVED : 10,
    FACK_SENT         : 11,
    SEQNO_SENT        : 12,
    CACK_SENT         : 13

  state = RPCState.IDLE

  seqNo = 1
  subPort = Math.floor(Math.random() * 4294967296)

  pktr.on 'command', (sub_port, seq_no, command, data) -> 
    console.log(sub_port, seq_no, command, data)
    #Insert state machine here

  getCommands: ->
    Command
  
  getRPCStates: ->
    RPCState

  getState: ->
    state

  connect: (address, port) ->
    if address? and port?
      connectAddress = address
      connectPort    = port
    pktr.sendCommand(Command.CONNECT, "HWDB\0", subPort, seqNo)
    pktr.listen()
    #pktr.close()

exports.jsrpc = JSRPC
