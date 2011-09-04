EventEmitter = require('events').EventEmitter

class Packeteer extends EventEmitter

  udp = require 'dgram'
  outbound_socket = udp.createSocket "udp4"

  connectAddress  = '192.168.1.1'
  connectPort     = 987

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

  close: ->
    outbound_socket.close()

exports.packeteer = Packeteer
