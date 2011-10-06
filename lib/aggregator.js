(function() {
  var Aggregator, MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USERNAME, hwdb, mysql_lib;
  MYSQL_HOST = 'localhost';
  MYSQL_PORT = 3306;
  MYSQL_USERNAME = 'homework';
  MYSQL_PASSWORD = 'whatever';
  MYSQL_DATABASE = 'bandwidth_data';
  mysql_lib = require('mysql');
  hwdb = require('./jsrpc').jsrpc;
  Aggregator = (function() {
    var mysql;
    function Aggregator() {}
    mysql = null;
    Aggregator.prototype.initialize = function() {
      var last_insert_check;
      hwdb.connect();
      mysql = mysql_lib.createClient({
        host: MYSQL_HOST,
        port: MYSQL_PORT,
        user: MYSQL_USERNAME,
        password: MYSQL_PASSWORD
      });
      mysql.useDatabase(MYSQL_DATABASE);
      last_insert_check = mysql.query('SELECT date,hour FROM bandwidth_hours ORDER BY date DESC, hour DESC LIMIT 1');
      return last_insert_check.on('row', function(row) {
        var date_last, date_now, expected_last_date;
        date_last = new Date(row.date.getUTCFullYear(), row.date.getUTCMonth(), row.date.getUTCDay() + 1, row.hour);
        date_now = new Date();
        expected_last_date = new Date(date_now.getUTCFullYear(), date_now.getUTCMonth(), date_now.getUTCDay(), date_now.getUTCHours());
        if (date_last.toLocaleString() < expected_last_date.toLocaleString()) {
          console.log("Data missing");
          return "START_HOUR\nEND_HOUR\n\n#SETUP A SEQUENCE\nfor each missing hour\n  hwdb.query(\"SQL:select * from BWUsage where START END\")\n  #ASYNC?\n  hwdb.on 'message', (data) ->\n    #MAP->REDUCE magic?\n    for each entry\n      sum[device]++\n\n    mysql.query('INSERT INTO bandwidth_hours (date,hour,ip,bytes) VALUES (?,?,?,?)',\n              [date, hour, ip, sum[device]]\n    )\n\nCHECK:\n  SELECT .. BETWEEN START AND END\n  NUMBER OF ROWS CORRECT?";
        }
      });
    };
    return Aggregator;
  })();
  exports.aggregator = new Aggregator;
}).call(this);
