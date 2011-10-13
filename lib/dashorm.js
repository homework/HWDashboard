(function() {
  var DashORM, MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USERNAME, dashboardModel, models, mysql_lib;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  MYSQL_HOST = 'localhost';
  MYSQL_PORT = 3306;
  MYSQL_USERNAME = 'homework';
  MYSQL_PASSWORD = 'whatever';
  MYSQL_DATABASE = 'bandwidth_data';
  models = require('../public/scripts/models').models;
  mysql_lib = require('mysql');
  dashboardModel = new models.DashboardModel();
  DashORM = (function() {
    var mysql;
    function DashORM() {
      this.query = __bind(this.query, this);
    }
    mysql = null;
    DashORM.prototype.initialize = function() {
      mysql = mysql_lib.createClient({
        host: MYSQL_HOST,
        port: MYSQL_PORT,
        user: MYSQL_USERNAME,
        password: MYSQL_PASSWORD
      });
      return mysql.useDatabase(MYSQL_DATABASE);
    };
    DashORM.prototype.query = function(model, parameters, response) {
      var current_date, date_string, last_update, month_id, month_str, month_totals;
      switch (model) {
        case "allowances":
          month_str = parameters[0] + "-" + parameters[1];
          month_id = parameters[0] + "/" + parameters[1];
          date_string = month_str + "-01";
          current_date = new Date();
          if (dashboardModel.monthlyallowances.get(month_str) !== void 0) {
            last_update = dashboardModel.monthlyallowances.get(month_str).lastUpdated;
          } else {
            last_update = new Date(0);
          }
          console.log(current_date - last_update);
          if (current_date.getFullYear() === parseInt(parameters[0]) && (current_date.getMonth() + 1) === parseInt(parameters[1]) && (current_date - last_update < 360000)) {
            return response.json(dashboardModel.monthlyallowances.get(month_str).xport());
          } else {
            if (dashboardModel.monthlyallowances.get(month_str) === void 0) {
              dashboardModel.monthlyallowances.add(new models.MonthlyAllowance({
                id: month_str
              }));
            }
            month_totals = mysql.query("SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " + "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip", [date_string, date_string]);
            month_totals.on('row', function(row) {
              var current_household_usage;
              dashboardModel.monthlyallowances.get(month_str).devices.add(new models.Allowance({
                id: row.ip,
                usage: parseInt(row['SUM(bytes)']),
                allowance: 5000000000
              }));
              current_household_usage = dashboardModel.monthlyallowances.get(month_str).household.get("usage");
              return dashboardModel.monthlyallowances.get(month_str).household.set({
                usage: current_household_usage + parseInt(row['SUM(bytes)'])
              });
            });
            return month_totals.on('end', __bind(function() {
              return response.json(dashboardModel.monthlyallowances.get(month_str).xport());
            }, this));
          }
          break;
        case "usage":
          return console.log("No usage ORM");
      }
    };
    DashORM.prototype.liveUpdate = function(package) {
      var hh_usage, item, item_date, item_str, _i, _len;
      for (_i = 0, _len = package.length; _i < _len; _i++) {
        item = package[_i];
        item_date = new Date(parseInt(item.timestamp) * 100);
        item_str = item_date.getFullYear() + "-" + (item_date.getMonth() + 1);
        hh_usage = dashboardModel.monthlyallowances.get(item_str).household.get("usage");
        dashboardModel.monthlyallowances.get(item_str).household.set({
          usage: hh_usage + parseInt(item.bytes)
        });
      }
      return dashboardModel.monthlyallowances.get("2011-10").xport();
    };
    return DashORM;
  })();
  exports.dashorm = new DashORM;
}).call(this);
