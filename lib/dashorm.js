(function() {
  var DashORM, MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USERNAME, models, mysqlLib;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  MYSQL_HOST = 'localhost';
  MYSQL_PORT = 3306;
  MYSQL_USERNAME = 'homework';
  MYSQL_PASSWORD = 'whatever';
  MYSQL_DATABASE = 'bandwidth_data';
  models = require('../public/scripts/models').models;
  mysqlLib = require('mysql');
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
            if (current_date - last_update < 360000) {
              if (response) {
                response.json(this.dashboardModel.monthlyallowances.get(month_str).xport());
              } else {
                return response.json(this.dashboardModel.monthlyallowances.get(month_str).xport());
              }
              return;
            }
          }
          ma = new models.MonthlyAllowance({
            id: month_str
          });
          ma.household.set({
            allowance: 5000000000
          });
          month_totals = this.mysql.query("SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " + "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip", [date_string, date_string]);
          month_totals.on('row', function(row) {
            var current_household_usage;
            ma.devices.add(new models.Allowance({
              id: row.ip,
              usage: parseInt(row['SUM(bytes)']),
              allowance: 5000000000
            }));
            current_household_usage = ma.household.get("usage");
            return ma.household.set({
              usage: current_household_usage + parseInt(row['SUM(bytes)'])
            });
          });
          return month_totals.on('end', __bind(function(result) {
            if (this_month) {
              this.dashboardModel.monthlyallowances.add(ma);
            }
            if (response) {
              return response.json(ma.xport());
            } else {
              return ma.xport();
            }
          }, this));
        case "usage":
          return console.log("No usage ORM");
      }
    };
    DashORM.prototype.liveUpdate = function(package) {
      var hh_usage, item, item_date, item_str, month_model, _i, _len;
      for (_i = 0, _len = package.length; _i < _len; _i++) {
        item = package[_i];
        item_date = new Date(parseInt(item.timestamp) * 100);
        item_str = item_date.getFullYear() + "-" + (item_date.getMonth() + 1);
        month_model = this.dashboardModel.monthlyallowances.get(item_str);
        if (month_model !== void 0) {
          hh_usage = month_model.household.get("usage");
          this.dashboardModel.monthlyallowances.get(item_str).household.set({
            usage: hh_usage + parseInt(item.bytes)
          });
        }
      }
      if (month_model !== void 0) {
        return this.dashboardModel.monthlyallowances.get("2011-10").xport();
      }
    };
    return DashORM;
  })();
  exports.dashorm = DashORM;
}).call(this);
