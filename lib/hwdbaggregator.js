(function() {
  var EventEmitter, HWDBAggregator, JSRPC, QUERY_INTERVAL, __;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  EventEmitter = require('events').EventEmitter;
  JSRPC = require('./jsrpc').jsrpc;
  __ = require('underscore')._;
  QUERY_INTERVAL = 3;
  HWDBAggregator = (function() {
    __extends(HWDBAggregator, EventEmitter);
    function HWDBAggregator() {
      this.hwdb_live = new JSRPC("127.0.0.1", 987);
      this.hwdb_historical = new JSRPC("127.0.0.1", 987);
      this.hwdb_historical.once('connected', __bind(function() {
        if (this.hwdb_live.getConnected()) {
          return this.emit('connected');
        } else {
          return this.hwdb_live.once('connected', __bind(function() {
            return this.emit('connected');
          }, this));
        }
      }, this));
      this.hwdb_live.connect();
      this.hwdb_historical.connect();
    }
    HWDBAggregator.prototype.getQueryInterval = function() {
      return QUERY_INTERVAL;
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
      this.hwdb_historical.once('message', __bind(function(rows) {
        var historical_result, live_result;
        historical_result = 0;
        live_result = 0;
        if (rows[0].status === "Success" && rows[0].rows > 0) {
          historical_result = __(rows.slice(1)).map(function(row) {
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
        }
        this.hwdb_live.once('message', __bind(function(rows) {
          var bytes, hour_result, ip;
          if (rows[0].status === "Success" && rows[0].rows > 0) {
            live_result = __(rows.slice(1)).map(function(row) {
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
          }
          if (historical_result != null) {
            hour_result = historical_result;
          }
          for (ip in historical_result) {
            bytes = historical_result[ip];
            live_result[ip] = (live_result[ip] || 0) + bytes;
          }
          return callback(live_result);
        }, this));
        return setTimeout(__bind(function() {
          return this.hwdb_live.query(query);
        }, this), QUERY_INTERVAL * 1000);
      }, this));
      return this.hwdb_historical.query(query);
    };
    HWDBAggregator.prototype.destroy = function() {
      this.hwdb_live.once('disconnected', __bind(function() {
        if (this.hwdb_historical.getConnected()) {
          return this.hwdb_historical.once('disconnected', __bind(function() {
            return console.log("DC");
          }, this));
        }
      }, this));
      this.hwdb_live.disconnect();
      return this.hwdb_historical.disconnect();
    };
    return HWDBAggregator;
  })();
  exports.hwdbaggregator = HWDBAggregator;
}).call(this);
