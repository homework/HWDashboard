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
  udp = require 'dgram'
  outbound_socket = udp.createSocket "udp4"

  getCommands: ->
    Command
  
  getRPCStates: ->
    RPCState

  getState: ->
    state

  getBytes: (newCommand, seq_no, sub_port) ->
    "HWDB"

  sendBytes: (data) ->
    prepped_data = new Buffer(data)
    outbound_socket.send(prepped_data, 0, prepped_data.length, 987, 'localhost')

  sendCommand: (newCommand, newState) ->
    this.sendBytes( this.getBytes(newCommand, 0, 0))
    state = newState

  connect: (address, port) ->
    this.sendCommand(Command.CONNECT, RPCState.CONNECT_SENT)
    outbound_socket.close()

exports.jsrpc = JSRPC
