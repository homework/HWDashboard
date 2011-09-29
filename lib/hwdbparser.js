(function() {
  var HWDBParser;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  HWDBParser = (function() {
    function HWDBParser() {
      this.parseQueryOrResponse = __bind(this.parseQueryOrResponse, this);
    }
    HWDBParser.prototype.parseQueryOrResponse = function(data) {
      var column, column_count, columns, data_lines, fields, i, result, results, row, row_count, rows, _i, _j, _k, _len, _len2, _len3, _ref;
      data_lines = data.split('\n');
      result = data_lines[0].split('<|>');
      column_count = parseInt(result[2]);
      row_count = parseInt(result[3]);
      if (column_count >= 1 && row_count >= 1) {
        columns = (function() {
          var _i, _len, _ref, _results;
          _ref = (data_lines[1].split('<|>')).slice(0, -1);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            column = _ref[_i];
            _results.push((column.split(':'))[1]);
          }
          return _results;
        })();
        rows = [];
        _ref = data_lines.slice(2);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          if ((row != null) && row !== "") {
            fields = row.split('<|>').slice(0, -1);
            fields[0] = ((parseInt(fields[0].slice(1, -1), 16)).toString()).slice(0, 11);
            rows.push(fields);
          }
        }
        results = [];
        for (_j = 0, _len2 = rows.length; _j < _len2; _j++) {
          row = rows[_j];
          result = {};
          i = 0;
          for (_k = 0, _len3 = columns.length; _k < _len3; _k++) {
            column = columns[_k];
            result[column] = row[i++];
          }
          results.push(result);
        }
        return results;
      } else {
        return result[1];
      }
    };
    return HWDBParser;
  })();
  exports.hwdbparser = new HWDBParser;
}).call(this);
