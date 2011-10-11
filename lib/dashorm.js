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
      var date_string, month_id, month_str, month_totals;
      switch (model) {
        case "allowances":
          month_str = parameters[0] + "-" + parameters[1];
          month_id = parameters[0] + "/" + parameters[1];
          date_string = month_str + "-01";
          dashboardModel.monthlyallowances.add(new models.MonthlyAllowance({
            id: month_str
          }));
          month_totals = mysql.query("SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " + "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip", [date_string, date_string]);
          month_totals.on('row', function(row) {
            return dashboardModel.monthlyallowances.get(month_str).devices.add(new models.Allowance({
              id: row.ip,
              usage: parseInt(row['SUM(bytes)']),
              allowance: 5000000000
            }));
          });
          return month_totals.on('end', __bind(function() {
            return response.json(dashboardModel.monthlyallowances.get(month_str).xport());
          }, this));
        case "usage":
          return console.log("No usage ORM");
      }
    };
    return DashORM;
  })();
  exports.dashorm = new DashORM;
}).call(this);
