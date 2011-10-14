(function() {
  var Aggregator, MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USERNAME, hwdb_aggregator, mysql_lib;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  MYSQL_HOST = 'localhost';
  MYSQL_PORT = 3306;
  MYSQL_USERNAME = 'homework';
  MYSQL_PASSWORD = 'whatever';
  MYSQL_DATABASE = 'bandwidth_data';
  mysql_lib = require('mysql');
  hwdb_aggregator = require('./hwdbaggregator').hwdbaggregator;
  Aggregator = (function() {
    var mysql;
    function Aggregator() {}
    mysql = null;
    Aggregator.prototype.initialize = function() {
      var last_insert_check;
      mysql = mysql_lib.createClient({
        host: MYSQL_HOST,
        port: MYSQL_PORT,
        user: MYSQL_USERNAME,
        password: MYSQL_PASSWORD
      });
      mysql.useDatabase(MYSQL_DATABASE);
      last_insert_check = mysql.query('SELECT date,hour FROM bandwidth_hours ORDER BY date DESC, hour DESC LIMIT 1');
      return last_insert_check.on('row', __bind(function(row) {
        var date_last, date_now, expected_last_date, missing_hours;
        date_last = new Date(row.date.getUTCFullYear(), row.date.getUTCMonth(), row.date.getUTCDate() + 1, row.hour);
        date_now = new Date();
        expected_last_date = new Date(date_now.getUTCFullYear(), date_now.getUTCMonth(), date_now.getUTCDate(), date_now.getUTCHours() + 1);
        if (date_last < expected_last_date) {
          missing_hours = ((expected_last_date - date_last) / 1000) / 60 / 60;
          console.log(missing_hours);
          return this.recursivePopulator(expected_last_date, missing_hours);
        }
      }, this));
    };
    Aggregator.prototype.recursivePopulator = function(end_date, hour_count) {
      var start_date;
      console.log("End: " + end_date);
      start_date = new Date(end_date.getUTCFullYear(), end_date.getUTCMonth(), end_date.getUTCDate(), end_date.getUTCHours() + 2 - hour_count);
      console.log("Start: " + start_date.toLocaleString());
      return hwdb_aggregator.aggregateHour(start_date, __bind(function(result) {
        if ((hour_count - 1) > 0) {
          return this.recursivePopulator(end_date, hour_count - 1);
        }
      }, this));
    };
    return Aggregator;
  })();
  exports.aggregator = new Aggregator;
}).call(this);
