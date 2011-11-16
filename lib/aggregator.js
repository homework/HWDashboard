(function() {
  var Aggregator, HWDBAggregator, MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USERNAME, cron, mysqlLib;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  MYSQL_HOST = 'localhost';
  MYSQL_PORT = 3306;
  MYSQL_USERNAME = 'homework';
  MYSQL_PASSWORD = 'whatever';
  MYSQL_DATABASE = 'bandwidth_data';
  mysqlLib = require('mysql');
  HWDBAggregator = require('./hwdbaggregator').hwdbaggregator;
  cron = require('cron').CronJob;
  Aggregator = (function() {
    function Aggregator() {
      this.hwdb_aggregator = new HWDBAggregator;
      this.hwdb_aggregator.once('connected', __bind(function() {
        this.mysql = mysqlLib.createClient({
          host: MYSQL_HOST,
          port: MYSQL_PORT,
          user: MYSQL_USERNAME,
          password: MYSQL_PASSWORD
        });
        this.mysql.useDatabase(MYSQL_DATABASE);
        return cron('0 */1 * * * *', __bind(function() {
          var date_now, last_insert_check;
          date_now = new Date();
          last_insert_check = this.mysql.query('SELECT date,hour FROM bandwidth_hours ORDER BY date DESC, hour DESC LIMIT 1', __bind(function(err, results) {
            var date_string, last_hour;
            if (results.length === 0) {
              last_hour = new Date(Date.UTC(date_now.getUTCFullYear(), date_now.getUTCMonth(), date_now.getUTCDate(), date_now.getUTCHours() - 1));
              date_string = date_now.getUTCFullYear() + "/" + (date_now.getUTCMonth() + 1) + "/" + (date_now.getUTCDate());
              return this.mysql.query('INSERT INTO bandwidth_hours (date,hour,ip,bytes) VALUES (?,?,?,?)', [date_string, last_hour.getUTCHours(), "0.0.0.0", 0]);
            }
          }, this));
          return last_insert_check.once('row', __bind(function(row) {
            var date_last, expected_last_date, missing_hours;
            date_last = new Date(Date.UTC(row.date.getFullYear(), row.date.getMonth(), row.date.getDate(), row.hour));
            expected_last_date = new Date(Date.UTC(date_now.getUTCFullYear(), date_now.getUTCMonth(), date_now.getUTCDate(), date_now.getUTCHours() - 1));
            console.log(date_last, expected_last_date);
            if (date_last < expected_last_date) {
              missing_hours = ((expected_last_date - date_last) / 1000) / 60 / 60;
              if (missing_hours >= (3600 / this.hwdb_aggregator.getQueryInterval())) {
                missing_hours = 3600 / this.hwdb_aggregator.getQueryInterval();
              }
              missing_hours--;
              return this.recursivePopulator(expected_last_date, missing_hours);
            }
          }, this));
        }, this));
      }, this));
    }
    Aggregator.prototype.recursivePopulator = function(end_date, hour_count) {
      var start_date;
      start_date = new Date(Date.UTC(end_date.getUTCFullYear(), end_date.getUTCMonth(), end_date.getUTCDate(), end_date.getUTCHours() - hour_count));
      return this.hwdb_aggregator.aggregateHour(start_date, __bind(function(result) {
        var bytes, date_string, ip;
        if (result !== 0) {
          for (ip in result) {
            bytes = result[ip];
            date_string = start_date.getUTCFullYear() + "/" + (start_date.getUTCMonth() + 1) + "/" + (start_date.getUTCDate());
            this.mysql.query("INSERT INTO bandwidth_hours (date,hour,ip,bytes) VALUES (?,?,?,?)", [date_string, start_date.getUTCHours(), ip, bytes], function(e) {
              if (e && e.message.indexOf("Duplicate") !== -1) {}
            });
          }
        } else {
          date_string = start_date.getUTCFullYear() + "/" + (start_date.getUTCMonth() + 1) + "/" + (start_date.getUTCDate());
          this.mysql.query("INSERT INTO bandwidth_hours (date,hour,ip,bytes) VALUES (?,?,?,?)", [date_string, start_date.getUTCHours(), "0.0.0.0", 0], function(e) {
            if (e && e.message.indexOf("Duplicate") !== -1) {}
          });
        }
        if (hour_count > 0) {
          return setTimeout(__bind(function() {
            return this.recursivePopulator(end_date, hour_count - 1);
          }, this), 10000);
        }
      }, this));
    };
    Aggregator.prototype.destroy = function() {
      return this.hwdb_aggregator.destroy();
    };
    return Aggregator;
  })();
  exports.aggregator = Aggregator;
}).call(this);
