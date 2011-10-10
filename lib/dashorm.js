(function() {
  var DashORM, MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USERNAME, mysql_lib;
  MYSQL_HOST = 'localhost';
  MYSQL_PORT = 3306;
  MYSQL_USERNAME = 'homework';
  MYSQL_PASSWORD = 'whatever';
  MYSQL_DATABASE = 'bandwidth_data';
  mysql_lib = require('mysql');
  DashORM = (function() {
    var mysql;
    function DashORM() {}
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
    DashORM.prototype.query = function(model, parameters) {
      switch (model) {
        case "allowances":
          return getMonthlyAllowance(parameters[0], parameters[1]);
        case "usage":
          return console.log("No usage ORM");
      }
    };
    DashORM.prototype.getMonthlyAllowance = function(year, month) {
      var m, month_id, month_totals;
      month_id = year + "-" + month;
      date_string += month_id + "-01";
      m = new models.MonthlyAllowance({
        id: month_id
      });
      month_totals = mysql.query("SELECT ip, SUM(bytes) FROM bandwidth_data WHERE date " + "BETWEEN '?' AND DATE_ADD('?', INTERVAL 1 MONTH) GROUP BY ip", [date_string, date_string]);
      return month_totals.on('row', function(row) {
        return models.monthlyallowances.get(month_id).devices.add(new models.MonthlyAllowance, {
          id: row.ip,
          usage: row.bytes,
          allowance: 0
        });
      });
    };
    return DashORM;
  })();
  exports.dashorm = new DashORM;
}).call(this);
