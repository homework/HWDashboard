# Parser for the HWDB result parser

class HWDBParser

  parseQueryOrResponse: (data) =>

    data_lines = data.split('\n')
    result = data_lines[0].split('<|>')
    column_count = parseInt result[2]
    row_count = parseInt result[3]

    if column_count >= 1 and row_count >= 1

      columns = ( (column.split(':'))[1] for column in (data_lines[1].split('<|>')).slice(0,-1) )
      rows = []

      for row in data_lines.slice 2
        if row? and row isnt ""
          fields = row.split('<|>').slice(0,-1)
          fields[0] = ((parseInt(fields[0].slice(1,-1),16)).toString()).slice(0,11)
          rows.push(fields)

      results = []

      for row in rows
        result = {}
        i = 0
        for column in columns
          result[column] = row[i++]
        results.push result

      return results

    else

      return result[1]

exports.hwdbparser = new HWDBParser
