class Defragger

  # fragCount of fragNo
  fragCount     = 0
  fragNo        = 0
  currentLength = 4
  totalLength   = 0

  fullData = ""

  getTotalLength: ->
    return totalLength

  setup: (frag_no, total_length) ->
    fragNo      = frag_no
    totalLength = total_length+4
    fullData = new Buffer(total_length)

  push: (frag_count, data) ->
    if frag_count is fragCount+1
      data.copy(fullData, currentLength, 0, data.length)
      fragCount++
      currentLength += data.length
    return fragCount

  getData: ->
    fullData

  reset: ->
    fragCount     = 0
    fragNo        = 0
    currentLength = 4
    totalLength   = 0
    fullData = ""

exports.defragger = Defragger
