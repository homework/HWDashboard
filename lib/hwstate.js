(function() {
  var BB, EventEmitter, HWState, JSRPC, models;
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
  BB = require('backbone');
  models = require('../public/scripts/models').models;
  HWState = (function() {
    __extends(HWState, EventEmitter);
    function HWState(callback) {
      this.state = new models.MonthlyAllowance({
        id: "STATE"
      });
      this.hwdb = new JSRPC("127.0.0.1", 987);
      this.hwdb.connect();
      this.hwdb.once('connected', __bind(function() {
        return this.updateState(callback);
      }, this));
    }
    HWState.prototype.updateState = function(callback) {
      return this.updateDeviceNames(__bind(function() {
        console.log("devices");
        return setTimeout(__bind(function() {
          return this.updateUsers(__bind(function() {
            console.log("users");
            return setTimeout(__bind(function() {
              return this.updateAllowances(__bind(function() {
                console.log("allowances");
                return callback(this.state);
              }, this));
            }, this), 1000);
          }, this));
        }, this), 1000);
      }, this));
    };
    HWState.prototype.updateDeviceNames = function(callback) {
      this.hwdb.once('message', __bind(function(device_rows) {
        var device_row, _i, _len, _ref;
        if (device_rows[0].status === "Success" && device_rows[0].rows > 0) {
          _ref = device_rows.slice(1);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            device_row = _ref[_i];
            this.state.updateDevice(device_row.ip, 0, 0, device_row.name);
          }
        }
        if (callback) {
          return callback();
        } else {
          return this.emit('state', this.state);
        }
      }, this));
      return this.hwdb.query("SQL:select * from DeviceNames");
    };
    HWState.prototype.updateUsers = function(callback) {
      this.hwdb.once('message', __bind(function(user_rows) {
        var user_row, _i, _len, _ref;
        if (user_rows[0].status === "Success" && user_rows[0].rows > 0) {
          _ref = user_rows.slice(1);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            user_row = _ref[_i];
            this.state.updateDevice(user_row.ip, 0, 0, void 0, user_row.name);
          }
        }
        if (callback) {
          return callback();
        } else {
          return this.emit('state', this.state);
        }
      }, this));
      return this.hwdb.query("SQL:select * from Users");
    };
    HWState.prototype.updateAllowances = function(callback) {
      this.hwdb.once('message', __bind(function(allowance_rows) {
        var allowance_row, _i, _len, _ref;
        if (allowance_rows[0].status === "Success" && allowance_rows[0].rows > 0) {
          _ref = allowance_rows.slice(1);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            allowance_row = _ref[_i];
            if (allowance_row.ip === "HOME") {
              this.state.updateHousehold(0, allowance_row.allowance);
            } else {
              this.state.updateDevice(allowance_row.ip, 0, allowance_row.allowance);
            }
          }
        }
        if (callback) {
          return callback();
        } else {
          return this.emit('state', this.state);
        }
      }, this));
      return this.hwdb.query("SQL:select * from Allowances");
    };
    return HWState;
  })();
  exports.hwstate = HWState;
}).call(this);
