class Defragger

  # fragCount of fragNo
  fragCount   = 0
  fragNo      = 0
  totalLength = 0

  fullData = ""

  constructor: (frag_no, total_length) ->
    fragNo      = frag_no
    totalLength = total_length
    fragCount++

  push: (frag_count, data) ->
    if frag_count is fragCount+1
      fullData += data
      fragCount++
    return fragCount

  getData: ->
    fullData

exports.defragger = Defragger
