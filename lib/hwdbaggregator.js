(function() {
  var EventEmitter, HWDBAggregator, hwdb, __;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  EventEmitter = require('events').EventEmitter;
  hwdb = require('./jsrpc').jsrpc;
  __ = require('underscore')._;
  HWDBAggregator = (function() {
    __extends(HWDBAggregator, EventEmitter);
    function HWDBAggregator() {
      HWDBAggregator.__super__.constructor.apply(this, arguments);
    }
    HWDBAggregator.prototype.initialize = function() {
      return hwdb.connect();
    };
    HWDBAggregator.prototype.leadingZero = function(num) {
      if (num < 10) {
        return "0" + num;
      } else {
        return num;
      }
    };
    HWDBAggregator.prototype.formatDate = function(date) {
      var date_str;
      date_str = date.getUTCFullYear() + "/" + this.leadingZero(date.getUTCMonth() + 1) + "/" + this.leadingZero(date.getUTCDate()) + ":" + this.leadingZero(date.getUTCHours()) + ":" + this.leadingZero(date.getUTCMinutes()) + ":" + this.leadingZero(date.getUTCSeconds());
      return date_str;
    };
    HWDBAggregator.prototype.aggregateHour = function(date, callback) {
      var end_ts, start_ts;
      start_ts = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours())).getTime();
      end_ts = start_ts + 3600000;
      return this.aggregateQuery(start_ts, end_ts, callback);
    };
    HWDBAggregator.prototype.aggregateQuery = function(start, end, callback) {
      var end_str, query, start_str;
      start_str = this.formatDate(new Date(start));
      end_str = this.formatDate(new Date(end));
      query = "SQL:select * from BWStats [interval (";
      query += start_str + ", ";
      query += end_str + ")]";
      console.log("Querying: " + query);
      hwdb.once('message', function(rows) {
        var results;
        if (rows[0].status === "Success") {
          console.log("Status is successful");
          if (rows[0].rows > 0) {
            results = __(rows.slice(1)).map(function(row) {
              var row_data;
              row_data = {};
              row_data[row.ipaddr] = parseInt(row.bytes);
              return row_data;
            }).reduce(function(totals, row) {
              var bytes, ip;
              for (ip in row) {
                bytes = row[ip];
                if (!isNaN(bytes)) {
                  totals[ip] = (totals[ip] || 0) + bytes;
                }
              }
              return totals;
            });
            if (callback) {
              return callback(results);
            }
          } else {
            console.log("Empty result");
            if (callback) {
              return callback("empty");
            }
          }
        }
      });
      return hwdb.query(query);
    };
    HWDBAggregator.prototype.destroy = function() {
      hwdb.disconnect();
      return hwdb.on('disconnected', function() {
        return console.log("DC");
      });
    };
    return HWDBAggregator;
  })();
  exports.hwdbaggregator = new HWDBAggregator;
}).call(this);
