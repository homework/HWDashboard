(function() {
  var EventEmitter, HWDBAggregator, hwdb;
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
  HWDBAggregator = (function() {
    __extends(HWDBAggregator, EventEmitter);
    function HWDBAggregator() {
      HWDBAggregator.__super__.constructor.apply(this, arguments);
    }
    HWDBAggregator.prototype.initialize = function() {
      return hwdb.connect();
    };
    HWDBAggregator.prototype.aggregateHour = function(date, callback) {
      var end_ts, start_ts;
      start_ts = (new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours())).getTime();
      end_ts = start_ts + 3600000;
      console.log(start_ts);
      return this.aggregateQuery(start_ts, end_ts, callback);
    };
    HWDBAggregator.prototype.aggregateQuery = function(start, end, callback) {
      if (callback) {
        callback("bk");
      }
      return "#ASYNC?\nhwdb.on 'message', (data) ->\n  #MAP->REDUCE magic?\n  for each entry\n    sum[device]++";
    };
    return HWDBAggregator;
  })();
  exports.hwdbaggregator = new HWDBAggregator;
}).call(this);
