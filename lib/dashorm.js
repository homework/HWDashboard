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
      this.query = __bind(this.query, this);      this.dashboardModel = new models.DashboardModel();
      this.mysql = mysqlLib.createClient({
        host: MYSQL_HOST,
        port: MYSQL_PORT,
        user: MYSQL_USERNAME,
        password: MYSQL_PASSWORD
      });
      this.mysql.useDatabase(MYSQL_DATABASE);
      this.state_collector = new HWState(__bind(function(state) {
        return this.dashboardModel.monthlyallowances.add(state);
      }, this));
    }
    DashORM.prototype.query = function(model, parameters, response) {
      var current_date, date_string, month_id, month_model, month_str, month_totals, this_month;
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
            if (response) {
              response.json(this.dashboardModel.monthlyallowances.get(month_str).xport());
            } else {
              return this.dashboardModel.monthlyallowances.get(month_str).xport();
            }
          }
          month_model = this.dashboardModel.monthlyallowances.get("STATE").clone();
          month_model.set({
            id: month_str
          });
          month_totals = this.mysql.query("SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " + "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip", [date_string, date_string]);
          month_totals.on('row', __bind(function(mysql_row) {
            var device, user_total_usage, username;
            console.log(mysql_row);
            if (mysql_row.ip !== '0.0.0.0') {
              device = month_model.devices.get(mysql_row.ip);
              if ((device != null) && device.has("user")) {
                user_total_usage = parseInt(mysql_row['SUM(bytes)']);
                username = device.get("user");
                if (!month_model.users.get(username)) {
                  month_model.updateUser(username, parseInt(mysql_row['SUM(bytes)']));
                }
              }
              if (username != null) {
                month_model.updateDevice(mysql_row.ip, parseInt(mysql_row['SUM(bytes)']), device.get("allowances"), username);
              } else if (device != null) {
                month_model.updateDevice(mysql_row.ip, parseInt(mysql_row['SUM(bytes)']), device.get("allowances"));
              } else {
                month_model.updateDevice(mysql_row.ip, parseInt(mysql_row['SUM(bytes)']));
              }
              return month_model.updateHousehold(mysql_row['SUM(bytes)']);
            }
          }, this));
          if (this_month) {
            this.dashboardModel.monthlyallowances.remove(month_str);
            this.dashboardModel.monthlyallowances.add(month_model);
          }
          if (response) {
            return response.json(month_model.xport());
          } else {
            return month_model.xport();
          }
          break;
        case "usage":
          return console.log("No usage ORM");
      }
    };
    DashORM.prototype.liveUpdate = function(package) {
      var current_month, item, item_date, item_str, _i, _len;
      item_str = "";
      console.log(this.dashboardModel.monthlyallowances.pluck("id"));
      for (_i = 0, _len = package.length; _i < _len; _i++) {
        item = package[_i];
        item_date = new Date(parseInt(item.timestamp) * 100);
        item_str = item_date.getFullYear() + "-" + (item_date.getMonth() + 1);
        current_month = this.dashboardModel.monthlyallowances.get(item_str);
        if (current_month === void 0) {
          current_month = this.dashboardModel.monthlyallowances.get("STATE").clone();
          current_month.set({
            id: item_str
          });
        }
        current_month.updateHousehold(item.bytes);
        console.log(item);
        current_month.updateDevice(item.ipaddr, item.bytes);
        if (current_month.devices.get(item.ipaddr).has("user")) {
          current_month.updateUser(device_state.get("user"), item.bytes);
        }
        if (!this.dashboardModel.monthlyallowances.get(item_str)) {
          this.dashboardModel.monthlyallowances.add(current_month);
        }
      }
      console.log(item_str);
      return this.dashboardModel.monthlyallowances.get(item_str).xport();
    };
    return DashORM;
  })();
  exports.dashorm = DashORM;
}).call(this);
