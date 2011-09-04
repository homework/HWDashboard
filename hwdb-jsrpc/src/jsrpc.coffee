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

  seqNo = 1
  subPort = Math.floor(Math.random() * 4294967296)

  connectAddress  = '192.168.1.1'
  connectPort     = 987

  getCommands: ->
    Command
  
  getRPCStates: ->
    RPCState

  getState: ->
    state

  intToByteArray: (number, width) ->
    bArray = []
    hex_string = number.toString(16)
    if ((hex_string.length % 2) isnt 0)
      hex_string = "0" + hex_string
    bArray.push(0) for x in [0...( (hex_string.length/2) - width )]
    for i in [0...(hex_string.length/2)]
      bArray.push parseInt(hex_string[(i*2)..(i*2)+1], 16)
    return bArray
 
  sendCommand: (command, data, sub_port, seq_no) ->
    byteArray = []

    byteArray = byteArray.concat( this.intToByteArray(sub_port, 4) )
    byteArray = byteArray.concat( this.intToByteArray(seq_no, 4) )
    byteArray = byteArray.concat( this.intToByteArray(command, 2) )

    byteArray.push 1 # Fragment
    byteArray.push 1 # Fragment Count

    for i in [0...data.length]
      byteArray.push data.charCodeAt(i)

    prepped_data = new Buffer(byteArray)
    outbound_socket.send(prepped_data, 0, prepped_data.length, connectPort, connectAddress)

  connect: (address, port) ->
    if address? and port?
      connectAddress = address
      connectPort    = port
    this.sendCommand(Command.CONNECT, "HWDB\0", subPort, seqNo)
    state = RPCState.CONNECT_SENT # State callbacks?
    outbound_socket.close()

exports.jsrpc = JSRPC
