EventEmitter  = require('events').EventEmitter
pktr          = require('./packeteer').packeteer
hwdbparser    = require('./hwdbparser').hwdbparser

class JSRPC extends EventEmitter

  Command = 
    ERROR       : 0,
    CONNECT     : 1,
    CACK        : 2,
    QUERY       : 3,
    QACK        : 4,
    RESPONSE    : 5,
    RACK        : 6,
    DISCONNECT  : 7,  # TODO - test
    DACK        : 8,
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
    DISCONNECT_SENT   : 7,  # TODO - test
    FRAGMENT_SENT     : 8,  # TODO
    FACK_RECEIVED     : 9,  # TODO
    FRAGMENT_RECEIVED : 10, # TODO
    FACK_SENT         : 11, # TODO
    SEQNO_SENT        : 12, # TODO

  state = RPCState.IDLE

  outboundSeqNo = 0
  inboundSeqNo = 0
  outboundSubPort = Math.floor(Math.random() * 4294967296)
  inboundSubPort = 0
  lport = 0

  #TODO
  #pingsTilPurge = ?
  #ticksTilPing = ?


  setupCommandListener: ->
    pktr.on("command", (sub_port, seq_no, command, data) =>

      if command is Command.FRAGMENT
        #Reassemble
      else if command is Command.PING
        console.log "PING!"
        pktr.sendCommand(Command.PACK, "", sub_port, seq_no)
      else if command is Command.PACK
        #Reset pingsTilPurge and ticksTilPing
      else if sub_port is outboundSubPort # JSRPC(Requestor) -> RPCServer(Responder)

        console.log seq_no, outboundSeqNo

        if seq_no < outboundSeqNo
          console.log "Received old/repeat sequence number from responder"
        else if seq_no > (outboundSeqNo+1)
          console.log "Received sequence number too far ahead"
        else
          console.log "Sequence number is correct"
          switch command
            when Command.CACK
              console.log "CONNECT acknowledged"
              state = RPCState.IDLE
              @emit 'connected'
            when Command.QACK
              console.log "QUERY acknowledged"
              state = RPCState.AWAITING_RESPONSE
            when Command.RESPONSE
              console.log "RESPONSE received:", data.slice(4)
              @emit 'message', hwdbparser.parseQueryOrResponse data.slice(4)
              pktr.sendCommand(Command.RACK, "", outboundSubPort, outboundSeqNo)
              state = RPCState.IDLE
            when Command.SACK
              console.log "SEQNO acknowledged"
            when Command.DACK
              console.log "DISCONNECT acknowledged"
              pktr.close()

      else if sub_port is inboundSubPort or inboundSubPort is 0# JSRPC(Responder) <- RPCServer(Requestor)

        if inboundSubPort is 0
          inboundSubPort = sub_port
          inboundSeqNo = seq_no

        console.log seq_no, inboundSeqNo

        if seq_no < inboundSeqNo
          console.log "Received old/repeat sequence number from requestor"
        else if seq_no > (inboundSeqNo+1)
          console.log "Received sequence number too far ahead from requestor"
        else
          console.log "Sequence number is correct"
          switch command
            when Command.CONNECT
              console.log "Got CONNECT"
              pktr.sendCommand(Command.CACK, "", inboundSubPort, inboundSeqNo)
              state = RPCState.IDLE
            when Command.QUERY
              console.log "Got QUERY:", data.slice(4)
              @emit 'message', hwdbparser.parseQueryOrResponse data.slice(4)
              pktr.sendCommand(Command.QACK, "", inboundSubPort, ++inboundSeqNo)
              state = RPCState.QACK_SENT
              pktr.sendCommand(Command.RESPONSE, "OK\0", inboundSubPort, inboundSeqNo)
              state = RPCState.RESPONSE_SENT
            when Command.RACK
              console.log "Got RACK"
              state = RPCState.IDLE
            when Command.DISCONNECT
              console.log "Server requesting disconnect"
              pktr.sendCommand(Command.DACK, "", inboundSubPort, inboundSeqNo)
              state = RPCState.TIMEDOUT
            when Command.SEQNO
              console.log "Server requesting SEQNO reset"
              # if state == RPCState.RESPONSE_SENT 
              #   console.log "Server didn't get our RACK
              # if state == RPCState.IDLE
              #   seqno not stored locally, sends back
              #   pktr.sendCommand(Command.SACK, "", sub_port, NEWSEQNO)
    )

  #Helper methods for testing, can JSRPC be extended with these for testing?
  getCommands: ->
    Command
  getRPCStates: ->
    RPCState
  getState: ->
    state

  connect: (address, port) ->
    this.setupCommandListener()
    if address? and port?
      connectAddress = address
      connectPort    = port
    pktr.sendCommand(Command.CONNECT, "HWDB\0", outboundSubPort, outboundSeqNo)
    state = RPCState.CONNECT_SENT
    lport = pktr.listen()

  query: (query) ->
    query += lport + " Handler\0"
    query_header =   String.fromCharCode(0) + String.fromCharCode(query.length)
    query_header +=  String.fromCharCode(0) + String.fromCharCode(query.length)
    query = query_header + query
    this.once('connected', ->
      pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo)
    )
    state = RPCState.QUERY_SENT

  disconnect: ->
    pktr.sendCommand(Command.DISCONNECT, query, outboundSubPort, outboundSeqNo)
    state = RPCState.DISCONNECT_SENT

exports.jsrpc = new JSRPC
