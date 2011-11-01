(function() {
  var DashORM, HWState, MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USERNAME, models, mysqlLib;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  MYSQL_HOST = 'localhost';
  MYSQL_PORT = 3306;
  MYSQL_USERNAME = 'homework';
  MYSQL_PASSWORD = 'whatever';
  MYSQL_DATABASE = 'bandwidth_data';
  models = require('../public/scripts/models').models;
  mysqlLib = require('mysql');
  HWState = require('./hwstate').hwstate;
  DashORM = (function() {
    function DashORM() {
      this.query = __bind(this.query, this);      this.stateC = new HWState;
      this.stateC.on('update', __bind(function(s) {
        console.log("Got update");
        this.state = s;
        this.dashboardModel = new models.DashboardModel();
        this.mysql = mysqlLib.createClient({
          host: MYSQL_HOST,
          port: MYSQL_PORT,
          user: MYSQL_USERNAME,
          password: MYSQL_PASSWORD
        });
        return this.mysql.useDatabase(MYSQL_DATABASE);
      }, this));
    }
    DashORM.prototype.query = function(model, parameters, response) {
      var current_date, date_string, last_update, ma, month_id, month_str, month_totals, this_month;
      if (response == null) {
        response = 0;
      }
      switch (model) {
        case "allowances":
          month_str = parameters[0] + "-" + parameters[1];
          month_id = parameters[0] + "/" + parameters[1];
          date_string = month_str + "-01";
          current_date = new Date();
          this_month = current_date.getFullYear() === parseInt(parameters[0]) && (current_date.getMonth() + 1) === parseInt(parameters[1]);
          if (this_month && this.dashboardModel.monthlyallowances.get(month_str) !== void 0) {
            last_update = this.dashboardModel.monthlyallowances.get(month_str).lastUpdated;
            if ((current_date - last_update) < 360000000) {
              console.log("Returned in-memory model");
              if (response) {
                response.json(this.dashboardModel.monthlyallowances.get(month_str).xport());
              } else {
                return response.json(this.dashboardModel.monthlyallowances.get(month_str).xport());
              }
            }
          }
          ma = new models.MonthlyAllowance({
            id: month_str
          });
          month_totals = this.mysql.query("SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " + "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip", [date_string, date_string]);
          month_totals.on('row', __bind(function(mysql_row) {
            var current_household_usage, device, user_total_allowance, user_total_usage;
            if (mysql_row.ip !== '0.0.0.0') {
              device = this.state.devices.get(mysql_row.ip);
              if (device.has("user")) {
                user_total_usage = parseInt(mysql_row['SUM(bytes)']);
                user_total_allowance = 0;
                this.state.devices.each(__bind(function(mm_device) {
                  if (this.state.devices.get(mm_device.id).get("user") === this.state.devices.get(mysql_row.ip).get("user")) {
                    console.log("Matched user");
                    return user_total_allowance += device.get("allowance");
                  }
                }, this));
                if (!ma.users.get(device.get("user"))) {
                  ma.users.add(new models.Allowance({
                    id: device.get("user"),
                    usage: user_total_usage,
                    allowance: user_total_allowance || -1
                  }));
                }
              }
              ma.devices.add(new models.Allowance({
                id: mysql_row.ip,
                usage: parseInt(mysql_row['SUM(bytes)']),
                allowance: device.get("allowance") || -1
              }));
              current_household_usage = ma.household.get("usage");
              return ma.household.set({
                usage: parseInt(current_household_usage) + parseInt(mysql_row['SUM(bytes)'])
              });
            }
          }, this));
          ma.household.set({
            allowance: this.state.devices.get("HOME").get("allowance")
          });
          if (this_month) {
            this.dashboardModel.monthlyallowances.remove(month_str);
            this.dashboardModel.monthlyallowances.add(ma);
          }
          if (response) {
            return response.json(ma.xport());
          } else {
            return ma.xport();
          }
          break;
        case "usage":
          return console.log("No usage ORM");
      }
    };
    DashORM.prototype.liveUpdate = function(package) {
      var device, device_state, hh_usage, item, item_date, item_str, mm_device, month_model, user, user_model, user_total_allowance, user_total_usage, _i, _len;
      for (_i = 0, _len = package.length; _i < _len; _i++) {
        item = package[_i];
        console.log("Got: " + item);
        item_date = new Date(parseInt(item.timestamp) * 100);
        item_str = item_date.getFullYear() + "-" + (item_date.getMonth() + 1);
        month_model = this.dashboardModel.monthlyallowances.get(item_str);
        if (month_model !== void 0) {
          hh_usage = month_model.household.get("usage");
          month_model.household.set({
            usage: hh_usage + parseInt(item.bytes)
          });
          device_state = this.state.devices.get(item.ipaddr);
          if (device_state.has("user")) {
            user = device_state.get("user");
            user_model = month_model.users.get(user);
            console.log("IP in @state has user: " + user);
            user_total_usage = parseInt(item.bytes);
            user_total_allowance = 0;
            month_model.devices.each(__bind(function(mm_device) {
              if (this.state.devices.get(mm_device.id).get("user") === this.state.devices.get(item.ipaddr).get("user")) {
                console.log("Matched user");
                user_total_usage += mm_device.get("usage");
                user_total_allowance += device_state.get("allowance");
              }
              return console.log(device_state.get("allowance"));
            }, this));
            console.log("US: " + user_total_usage + ", AL: " + user_total_allowance);
            if (user_model) {
              console.log("User model exists, setting");
              user_model.set({
                usage: user_total_usage,
                allowance: user_total_allowance
              });
            } else {
              console.log("No user model, adding");
              month_model.users.add(new models.Allowance({
                id: this.state.devices.get(item.ipaddr).get("user"),
                usage: user_total_usage,
                allowance: user_total_allowance
              }));
            }
          }
          mm_device = month_model.devices.get(item.ipaddr);
          device = this.state.devices.get(item.ipaddr);
          if (mm_device) {
            mm_device.set({
              usage: parseInt(mm_device.get("usage")) + parseInt(item.bytes)
            });
          } else {
            month_model.devices.add(new models.Allowance({
              id: item.ipaddr,
              usage: parseInt(item.bytes),
              allowance: device.get("allowance") || -1
            }));
          }
        }
      }
      if (month_model !== void 0) {
        return this.dashboardModel.monthlyallowances.get(item_str).xport();
      }
    };
    DashORM.prototype.updateORMState = function() {};
    return DashORM;
  })();
  exports.dashorm = DashORM;
}).call(this);
