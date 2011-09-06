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
    DISCONNECT  : 7,  # TODO
    DACK        : 8,  # TODO
    FRAGMENT    : 9,  # TODO
    FACK        : 10, # TODO
    PING        : 11, # TODO
    PACK        : 12, 
    SEQNO       : 13, # TODO
    SACK        : 14  # TODO

  RPCState =
    IDLE              : 0,
    QACK_SENT         : 1,
    RESPONSE_SENT     : 2,
    CONNECT_SENT      : 3,
    QUERY_SENT        : 4,
    AWAITING_RESPONSE : 5,
    TIMEDOUT          : 6,  # TODO
    DISCONNECT_SENT   : 7,  # TODO
    FRAGMENT_SENT     : 8,  # TODO
    FACK_RECEIVED     : 9,  # TODO
    FRAGMENT_RECEIVED : 10, # TODO
    FACK_SENT         : 11, # TODO
    SEQNO_SENT        : 12, # TODO

  state = RPCState.IDLE

  seqNo = 0
  subPort = Math.floor(Math.random() * 4294967296)
  lport = 0

  pktr.on 'command', (sub_port, seq_no, command, data) =>
    switch command
      when Command.CONNECT
        console.log "Got CONNECT"
        pktr.sendCommand(Command.CACK, "", sub_port, seq_no)
        state = RPCState.IDLE
      when Command.CACK
        console.log "Got CACK"
        state = RPCState.IDLE
      when Command.QACK
        console.log "Got QACK"
        state = RPCState.AWAITING_RESPONSE
      when Command.RESPONSE
        console.log "Got RESPONSE:", data.slice(4)
        pktr.sendCommand(Command.RACK, "", sub_port, seq_no)
        state = RPCState.RACK
      when Command.QUERY
        console.log "Got QUERY:", data
        pktr.sendCommand(Command.QACK, "", sub_port, seq_no)
        state = RPCState.QACK_SENT
        pktr.sendCommand(Command.RESPONSE, "OK\0", sub_port, seq_no)
        state = RPCState.RESPONSE_SENT
      when Command.RACK
        console.log "Got RACK"
        state = RPCState.IDLE
      when Command.PING
        console.log "PING!"
        pktr.sendCommand(Command.PACK)


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
    state = RPCState.CONNECT_SENT
    lport = pktr.listen()

  query: (query) ->
    query += lport + " Handler\0"
    query_header =   String.fromCharCode(0) + String.fromCharCode(query.length)
    query_header +=  String.fromCharCode(0) + String.fromCharCode(query.length)
    query = query_header + query
    process.nextTick( ->
      pktr.sendCommand(Command.QUERY, query, subPort, ++seqNo)
    )
    state = RPCState.QUERY_SENT
  
  close: ->
    pktr.close()

exports.jsrpc = new JSRPC
