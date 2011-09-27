EventEmitter      = require('events').EventEmitter
log               = new HWDashboardLogger("packeteer", 5)

class Packeteer extends EventEmitter

  udp = require 'dgram'
  inbound_socket  = udp.createSocket "udp4"
  outbound_socket = udp.createSocket "udp4"

  connectAddress  = '192.168.1.1'
  connectPort     = 987
  lport = 0

  intToByteArray: (number, width) ->
    bArray = []
    hex_string = number.toString(16)
    if ((hex_string.length % 2) isnt 0)
      hex_string = "0" + hex_string
    bArray.push(0) for x in [0...( (hex_string.length/2) - width )]
    for i in [0...(hex_string.length/2)]
      bArray.push parseInt(hex_string[(i*2)..(i*2)+1], 16)
    return bArray
 
  bufToInt: (buf, width) ->
    byteString = ""
    byteString += "00" for x in [0...( width - buf.length )]
    for x in [0...buf.length]
      hex_char = buf[x].toString(16)
      if hex_char.length is 1
        byteString += "0"
      byteString += hex_char
    parseInt(byteString,16)

  sendCommand: (command, data, sub_port, seq_no, frag_count=1, frag_no=1) ->

    byteArray = []
    byteArray = byteArray.concat( this.intToByteArray(sub_port, 4) )
    byteArray = byteArray.concat( this.intToByteArray(seq_no, 4) )
    byteArray = byteArray.concat( this.intToByteArray(command, 2) )
    byteArray.push frag_count
    byteArray.push frag_no

    for i in [0...data.length]
      byteArray.push data.charCodeAt(i)

    log.debug "Sending " + command

    prepped_data = new Buffer(byteArray)
    outbound_socket.send(prepped_data, 0, prepped_data.length, connectPort, connectAddress)

  listen: ->

    inbound_socket.on("message", (msg) =>

      sub_port    = this.bufToInt(msg.slice(0,4),4)
      seq_no      = this.bufToInt(msg.slice(4,8),4)
      command     = this.bufToInt(msg.slice(8,10),2)
      frag_count  = this.bufToInt(msg.slice(10,11),1)
      frag_no     = this.bufToInt(msg.slice(11,12),1)
      data        = (msg.slice(12))#.toString()

      log.debug "Receiving " + command

      @emit "command", sub_port, seq_no, command, data, frag_count, frag_no

    )

    inbound_socket.bind( outbound_socket.address().port )
    inbound_socket.address().port

  close: ->

    inbound_socket.close()
    outbound_socket.close()
