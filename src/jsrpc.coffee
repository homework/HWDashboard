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

  idleOutboundTimer = 0
  idleInboundTimer = 0

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
              if state == RPCState.CONNECT_SENT
                console.log "CONNECT acknowledged"
                @setState(RPCState.IDLE, 1)
                @emit 'connected'
            when Command.QACK
              console.log "QUERY acknowledged"
              if state == RPCState.QUERY_SENT
                if seq_no == outboundSeqNo
                  @setState(RPCState.AWAITING_RESPONSE, 1)
            when Command.RESPONSE
              if (state == RPCState.AWAITING_RESPONSE or RPCState.QUERY_SENT) and seq_no == outboundSeqNo
                @emit 'message', hwdbparser.parseQueryOrResponse data.slice(4)
                pktr.sendCommand(Command.RACK, "", outboundSubPort, outboundSeqNo)
                console.log "RESPONSE received:", data.slice(4)
                @setState(RPCState.IDLE, 1)
            when Command.SACK
              console.log "SEQNO acknowledged"
              @setState(RPCState.IDLE, 1)
            when Command.DACK
              console.log "DISCONNECT acknowledged"
              pktr.close()
              @emit 'disconnected'
            when Command.PACK
              @clearIdleTimer(1)
              console.log "PACK cleared"

      else if sub_port is inboundSubPort or inboundSubPort is 0# JSRPC(Responder) <- RPCServer(Requestor)

        if inboundSubPort is 0
          inboundSubPort = sub_port
          inboundSeqNo = seq_no

        console.log seq_no, inboundSeqNo

        if command == Command.SEQNO
          console.log "Server requesting SEQNO reset"
          if state == RPCState.RESPONSE_SENT
            console.log "Server didn't get our RACK"
            @setState(RPCState.IDLE, 0)
          if state == RPCState.IDLE
            inboundSeqNo = seq_no
            pktr.sendCommand(Command.SACK, "", sub_port, NEWSEQNO)

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
              @setState(RPCState.IDLE, 0)
            when Command.QUERY
              console.log "Got QUERY:", data.slice(4)
              @emit 'message', hwdbparser.parseQueryOrResponse data.slice(4)
              pktr.sendCommand(Command.QACK, "", inboundSubPort, ++inboundSeqNo)
              @setState(RPCState.QACK_SENT, 0)
              pktr.sendCommand(Command.RESPONSE, "OK\0", inboundSubPort, inboundSeqNo)
              @setState(RPCState.RESPONSE_SENT, 0)
            when Command.RACK
              if state == RPCState.RESPONSE_SENT and seq_no == inboundSeqNo
                console.log "Got RACK"
                @setState(RPCState.IDLE, 0)
            when Command.DISCONNECT
              console.log "Server requesting disconnect"
              pktr.sendCommand(Command.DACK, "", inboundSubPort, inboundSeqNo)
              @setState(RPCState.TIMEDOUT, 0)
            when Command.PACK
              @clearIdleTimer(0)
              console.log "PACK cleared"
    )


  #Helper methods for testing, can JSRPC be extended with these for testing?
  getCommands: ->
    Command
  getRPCStates: ->
    RPCState
  getState: ->
    state

  setState: (new_state, direction) ->
    state = new_state
    console.log "New state:", state
    if state == RPCState.IDLE
      @setIdleTimer(direction) # one for outbound, one for inbound
    else
      @clearIdleTimer(direction)

  setIdleTimer: (direction, ticks=3) ->
    if ticks is 0
      @setState(RPCState.TIMEDOUT)
      console.log "Tick timeout"
    else if direction is 0 # inbound
      clearTimeout(idleInboundTimer)
      console.log "Setting inbound timer"
      idleInboundTimer = setTimeout( =>
        console.log "Inbound RAN"
        pktr.sendCommand(Command.PING, "", inboundSubPort, inboundSeqNo)
        @setIdleTimer(direction, ticks-1)
      , 2000)
    else if direction is 1 # outbound
      clearTimeout(idleOutboundTimer)
      console.log "Setting outbound timer"
      idleOutboundTimer = setTimeout( =>
        console.log "Outbound RAN"
        pktr.sendCommand(Command.PING, "", outboundSubPort, outboundSeqNo)
        @setIdleTimer(direction, ticks-1)
      , 2000)

  clearIdleTimer: (direction) ->
    if direction is 0 # inbound
      console.log "Clearing inbound timer"
      clearTimeout(idleInboundTimer)
      idleInboundTimer = 0
    else if direction is 1 # outbound
      console.log "Clearing timer"
      clearTimeout(idleOutboundTimer)
      idleOutboundTimer = 0

  connect: (address, port) ->
    @setupCommandListener()
    if address? and port?
      connectAddress = address
      connectPort    = port
    @setState(RPCState.CONNECT_SENT)
    pktr.sendCommand(Command.CONNECT, "HWDB\0", outboundSubPort, outboundSeqNo)
    lport = pktr.listen()

  query: (query) ->
    query += lport + " Handler\0"
    query_header =   String.fromCharCode(0) + String.fromCharCode(query.length)
    query_header +=  String.fromCharCode(0) + String.fromCharCode(query.length)
    query = query_header + query
    this.once('connected', ->
      pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo)
      @setState(RPCState.QUERY_SENT)
    )

  disconnect: ->
    pktr.sendCommand(Command.DISCONNECT, "", outboundSubPort, outboundSeqNo)
    @setState(RPCState.DISCONNECT_SENT)

exports.jsrpc = new JSRPC
