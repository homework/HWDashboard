class Defragger

  # fragCount of fragNo
  fragCount   = 0
  fragNo      = 0
  totalLength = 0

  fullData = ""

  constructor: (frag_no, total_length) ->
    fragNo      = frag_no
    totalLength = total_length
    console.log "Initialized defragger: Length " + totalLength + ", Count " + fragNo
    fragCount++

  push: (frag_count, data) ->
    console.log "Got", frag_count
    console.log "Before", fullData.length, "of", totalLength
    if frag_count is fragCount+1
      fullData += data
      fragCount++
    console.log "After", fullData.length, "of", totalLength

  getData: ->
    fullData

exports.defragger = Defragger
