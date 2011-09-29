EventEmitter      = require('events').EventEmitter
pktr              = new Packeteer
hwdbparser        = new HWDBParser
Defragger         = new Defragger
log = HWDashboardLogger "jsrpc", 7

class JSRPC extends EventEmitter

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
    FRAGMENT    : 9, # TODO - outbound FRAGMENTs
    FACK        : 10,
    PING        : 11,
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
    TIMEDOUT          : 6,
    DISCONNECT_SENT   : 7,  # TODO - test
    FRAGMENT_SENT     : 8,  # TODO
    FACK_RECEIVED     : 9,  # TODO
    FRAGMENT_RECEIVED : 10, # TODO
    FACK_SENT         : 11,
    SEQNO_SENT        : 12,

  state = RPCState.IDLE
  connected = false

  outboundSeqNo = 0
  inboundSeqNo = 0
  outboundSubPort = Math.floor(Math.random() * 4294967294)
  inboundSubPort = 0
  lport = 0

  idleOutboundTimer = 0
  idleInboundTimer = 0

  defrag = 0

  pingInterval = 15 # seconds

  setupCommandListener: ->

    pktr.on("command", (sub_port, seq_no, command, data, frag_count, frag_no) =>

      # If last fragment
      if frag_count is frag_no and frag_count != 1
        defrag.push frag_count, (data.toString()).slice(4)
        pktr.emit "command", sub_port, seq_no, command, defrag.getData(), 1, 1
        defrag = 0

      if command isnt Command.FRAGMENT
        data = data.toString()

      log.debug "Command: " + command + ", " + frag_count + ", " + frag_no

      if command is Command.FRAGMENT

        if sub_port is outboundSubPort

          if seq_no is outboundSeqNo or seq_no is outboundSeqNo+1

            log.debug "Fragment sequence number is correct"

            total_length = pktr.bufToInt new Buffer(data.slice(0,2)), 2
            fragment_length = pktr.bufToInt new Buffer(data.slice(2,4)), 2

            log.debug "Fragment number: " + frag_count + "/" + frag_no

            if state is RPCState.AWAITING_RESPONSE

              if seq_no is outboundSeqNo and frag_count is 1

                defrag = new Defragger(frag_no, total_length)
                defrag.push frag_count, (data.toString()).slice(4)

                log.debug "Pushed first fragment into Defragger from server"

                @setState(RPCState.FACK_SENT, 1)
                pktr.sendCommand(Command.FACK, "", sub_port, outboundSeqNo, frag_count, frag_no)

            else if state is RPCState.FACK_SENT

              if seq_no is outboundSeqNo and defrag

                if (defrag.push frag_count, (data.toString()).slice(4)) is frag_count
                  log.debug "Pushed new fragment into Defragger from server"
                  @setState(RPCState.FACK_SENT, 1)
                  pktr.sendCommand(Command.FACK, "", sub_port, outboundSeqNo, frag_count, frag_no)

        else if sub_port is inboundSubPort

          if seq_no is inboundSeqNo or seq_no is inboundSeqNo+1

            log.debug "Fragment sequence number is correct"

            fragment_length = data.slice(0,1)
            total_length = data.slice(1,2)

            log.debug "Fragment number:" + frag_count + "/" + frag_no

            # Client received response but no RACK returned. Continue as normal
            if state is RPCState.RESPONSE_SENT and seq_no is (inboundSeqNo+1) and frag_no is 1
                @setState(RPCState.IDLE, 0)

            if state is RPCState.IDLE

              defrag = new Defragger(frag_count, total_length)
              defrag.push frag_count, (data.toString()).slice(4)

              log.debug "Pushed first fragment into Defragger from client"

              @setState(RPCState.FACK_SENT, 0)
              pktr.sendCommand(Command.FACK, "", sub_port, ++inboundSeqNo)

            else if state == RPCState.FACK_SENT

              if seq_no is inboundSeqNo and defrag

                if (defrag.push frag_no, data.slice(4)) is frag_count
                  log.debug "Pushed new fragment into Defragger from client"
                  @setState(RPCstate.FACK_SENT, 1)
                  pktr.sendCommand(Command.FACK, "", sub_port, inboundSeqNo)

      else if command is Command.PING

        log.debug "Received PING, sending PACK"
        pktr.sendCommand(Command.PACK, "", sub_port, seq_no)

      else if sub_port is outboundSubPort # JSRPC(Requestor) -> RPCServer(Responder)

        if seq_no is outboundSeqNo or seq_no is outboundSeqNo+1

          log.debug "Sequence number is correct"

          switch command

            when Command.CACK
              if state == RPCState.CONNECT_SENT
                log.debug "CONNECT acknowledged"
                @setState(RPCState.IDLE, 1)
                @emit 'connected'
                connected = true

            when Command.QACK
              if state == RPCState.QUERY_SENT and seq_no == outboundSeqNo
                log.debug "QUERY acknowledged"
                @setState(RPCState.AWAITING_RESPONSE, 1)

            when Command.RESPONSE
              if (state == RPCState.AWAITING_RESPONSE or RPCState.QUERY_SENT) and seq_no == outboundSeqNo
                @setState(RPCState.IDLE, 1)
                @emit 'message', hwdbparser.parseQueryOrResponse data.slice(4)
                pktr.sendCommand(Command.RACK, "", outboundSubPort, outboundSeqNo)
                log.debug "RESPONSE received:", data.slice(4)
                @setState(RPCState.IDLE, 1)

            when Command.SACK
              if state == RPCState.SEQNO_SENT
                log.debug "SEQNO acknowledged"
                @setState(RPCState.IDLE, 1)
                @emit 'SACK'

            when Command.DACK
              if state == RPCState.DISCONNECT_SENT
                log.debug "DISCONNECT acknowledged"
                pktr.close()
                @emit 'disconnected'

            when Command.PACK
                @clearIdleTimer(1)
                log.debug "PING acknowledged"
                @setState(RPCState.IDLE, 1) # Sets up new timer

      else if sub_port is inboundSubPort or inboundSubPort is 0 # JSRPC(Responder) <- RPCServer(Requestor)

        if inboundSubPort is 0
          inboundSubPort = sub_port
          inboundSeqNo = seq_no

        if command == Command.SEQNO

          log.debug "Server requesting SEQNO reset"

          if state == RPCState.RESPONSE_SENT
            log.debug "Server didn't get our RACK, ignoring"
            @setState(RPCState.IDLE, 0)

          if state == RPCState.IDLE
            log.debug "SACK sent"
            inboundSeqNo = seq_no
            pktr.sendCommand(Command.SACK, "", sub_port, inboundSeqNo)

        if seq_no is inboundSeqNo or seq_no is inboundSeqNo+1

          switch command

            when Command.CONNECT
              log.debug "Received CONNECT"
              pktr.sendCommand(Command.CACK, "", inboundSubPort, inboundSeqNo)
              @setState(RPCState.IDLE, 0)

            when Command.QUERY
              log.debug "Received QUERY: " + data.slice(4)
              @emit 'message', hwdbparser.parseQueryOrResponse data.slice(4)
              pktr.sendCommand(Command.QACK, "", inboundSubPort, ++inboundSeqNo)
              @setState(RPCState.QACK_SENT, 0)
              pktr.sendCommand(Command.RESPONSE, "OK\0", inboundSubPort, inboundSeqNo)
              @setState(RPCState.RESPONSE_SENT, 0)

            when Command.RACK
              if state == RPCState.RESPONSE_SENT and seq_no == inboundSeqNo
                log.debug "Received RACK"
                @setState(RPCState.IDLE, 0)

            when Command.DISCONNECT
              log.debug "Server requested disconnect, sending DACK"
              pktr.sendCommand(Command.DACK, "", inboundSubPort, inboundSeqNo)
              @setState(RPCState.TIMEDOUT, 0)

            when Command.PACK
              @clearIdleTimer(0)
              log.debug "Received PACK"
              @setState(RPCState.IDLE, 0) # Sets up new timer
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

    log.debug "New state: " + state

    if state == RPCState.IDLE
      @setIdleTimer(direction)
    else
      @clearIdleTimer(direction)

  setIdleTimer: (direction, ticks=3) ->

    if ticks is 0

      @setState(RPCState.TIMEDOUT)
      pktr.close()
      @emit 'timedout'

    else if direction is 0 # inbound

      clearTimeout(idleInboundTimer)

      log.debug "Setting new PING timer for inbound"

      idleInboundTimer = setTimeout( =>
        log.debug "Timer executed, sending PING on inbound and setting with " + ticks-1 + " ticks"
        pktr.sendCommand(Command.PING, "", inboundSubPort, inboundSeqNo)
        @setIdleTimer(direction, ticks-1)
      , pingInterval * 1000)

    else if direction is 1 # outbound

      clearTimeout(idleOutboundTimer)

      log.debug "Setting new PING timer for outbound"

      idleOutboundTimer = setTimeout( =>
        log.debug "Timer executed, sending PING on outbound and setting timer with " + ticks-1 + " ticks"
        pktr.sendCommand(Command.PING, "", outboundSubPort, outboundSeqNo)
        @setIdleTimer(direction, ticks-1)
      , pingInterval * 1000)

  clearIdleTimer: (direction) ->

    if direction is 0

      log.debug "Clearing inbound timer"

      clearTimeout(idleInboundTimer)
      idleInboundTimer = 0

    else if direction is 1 # outbound

      log.debug "Clearing outbound timer"

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

    if connected

      log.debug "Sending query: " + query

      if outboundSeqNo >= 4294967294 # Wrap around

        log.debug "SEQNO wrapping around"
        outboundSeqNo = 0
        pktr.sendCommand(Command.SEQNO, "", outboundSubPort, outboundSeqNo)
        @setState(RPCState.SEQNO_SENT)
        this.once('SACK', ->
          pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo)
        )

      else

        pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo)
        @setState(RPCState.QUERY_SENT)

    else

      log.debug "Not connected yet, queued query: " + query

      this.once('connected', ->
        pktr.sendCommand(Command.QUERY, query, outboundSubPort, ++outboundSeqNo)
        @setState(RPCState.QUERY_SENT)
      )

  disconnect: ->

    log.debug "Calling disconnect"

    pktr.sendCommand(Command.DISCONNECT, "", outboundSubPort, outboundSeqNo)
    @setState(RPCState.DISCONNECT_SENT)