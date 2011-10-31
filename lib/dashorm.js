(function() {
  var DashORM, JSRPC, MYSQL_DATABASE, MYSQL_HOST, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_USERNAME, models, mysqlLib;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  MYSQL_HOST = 'localhost';
  MYSQL_PORT = 3306;
  MYSQL_USERNAME = 'homework';
  MYSQL_PASSWORD = 'whatever';
  MYSQL_DATABASE = 'bandwidth_data';
  JSRPC = require('./jsrpc').jsrpc;
  models = require('../public/scripts/models').models;
  mysqlLib = require('mysql');
  DashORM = (function() {
    function DashORM() {
      this.query = __bind(this.query, this);      this.hwdb = new JSRPC("127.0.0.1", 987);
      this.hwdb.connect();
      this.dashboardModel = new models.DashboardModel();
      this.mysql = mysqlLib.createClient({
        host: MYSQL_HOST,
        port: MYSQL_PORT,
        user: MYSQL_USERNAME,
        password: MYSQL_PASSWORD
      });
      this.mysql.useDatabase(MYSQL_DATABASE);
      this.ip_allowances = {};
      this.user_allowances = {};
      this.devices = {};
      this.users = {};
    }
    DashORM.prototype.query = function(model, parameters, response) {
      var current_date, date_string, last_update, ma, month_id, month_str, this_month;
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
              return;
            }
          }
          ma = new models.MonthlyAllowance({
            id: month_str
          });
          this.ip_usage = {};
          this.hwdb.query("SQL:select * from DeviceNames");
          this.hwdb.once('message', __bind(function(device_rows) {
            var device_row, _i, _len, _ref;
            if (device_rows[0].status === "Success" && device_rows[0].rows > 0) {
              _ref = device_rows.slice(1);
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                device_row = _ref[_i];
                this.devices[device_row.ip] = device_row.name;
              }
            }
            console.log("Collected device names ");
            return setTimeout(__bind(function() {
              this.hwdb.query("SQL:select * from Users");
              return this.hwdb.once('message', __bind(function(hw_rows) {
                var hw_row, _j, _len2, _ref2;
                if (hw_rows[0].status === "Success" && hw_rows[0].rows > 0) {
                  _ref2 = hw_rows.slice(1);
                  for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                    hw_row = _ref2[_j];
                    this.users[hw_row.ip] = hw_row.name;
                  }
                }
                console.log("Collected user information.");
                return setTimeout(__bind(function() {
                  this.hwdb.once('message', __bind(function(hw_rows) {
                    var hw_row, month_totals, _k, _len3, _ref3;
                    if (hw_rows[0].status === "Success" && hw_rows[0].rows > 0) {
                      this.ip_allowances = {};
                      this.user_allowances = {};
                      _ref3 = hw_rows.slice(1);
                      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
                        hw_row = _ref3[_k];
                        this.ip_allowances[hw_row.ip] = parseInt(hw_row.allowance);
                        if (this.users[hw_row.ip] != null) {
                          if (this.user_allowances[this.users[hw_row.ip]] != null) {
                            this.user_allowances[this.users[hw_row.ip]] += parseInt(hw_row.allowance);
                          } else {
                            this.user_allowances[this.users[hw_row.ip]] = parseInt(hw_row.allowance);
                          }
                        }
                      }
                    }
                    console.log("Collected allowances information.");
                    month_totals = this.mysql.query("SELECT ip, SUM(bytes) FROM bandwidth_hours WHERE date " + "BETWEEN ? AND DATE_ADD(?, INTERVAL 1 MONTH) GROUP BY ip", [date_string, date_string]);
                    month_totals.on('row', __bind(function(mysql_row) {
                      var current_household_usage, ip_allowance, user;
                      if (mysql_row.ip !== '0.0.0.0') {
                        user = this.users[mysql_row.ip];
                        if (this.ip_allowances[mysql_row.ip] != null) {
                          ip_allowance = this.ip_allowances[mysql_row.ip];
                        } else {
                          ip_allowance = -1;
                        }
                        ma.users.add(new models.Allowance({
                          id: this.users[mysql_row.ip],
                          usage: parseInt(mysql_row['SUM(bytes)']),
                          allowance: ip_allowance
                        }));
                        ma.devices.add(new models.Allowance({
                          id: this.devices[mysql_row.ip] || mysql_row.ip,
                          usage: parseInt(mysql_row['SUM(bytes)']),
                          allowance: parseInt(ip_allowance)
                        }));
                        current_household_usage = ma.household.get("usage");
                        return ma.household.set({
                          usage: parseInt(current_household_usage) + parseInt(mysql_row['SUM(bytes)'])
                        });
                      }
                    }, this));
                    return month_totals.on('end', __bind(function(result) {
                      return ma.household.set({
                        allowance: this.ip_allowances['HOME']
                      });
                    }, this));
                  }, this));
                  return this.hwdb.query("SQL:select * from Allowances");
                }, this), 2000);
              }, this));
            }, this), 2000);
          }, this));
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
      var device, hh_usage, item, item_date, item_str, month_model, user, user_model, user_total_usage, _i, _len;
      for (_i = 0, _len = package.length; _i < _len; _i++) {
        item = package[_i];
        item_date = new Date(parseInt(item.timestamp) * 100);
        item_str = item_date.getFullYear() + "-" + (item_date.getMonth() + 1);
        month_model = this.dashboardModel.monthlyallowances.get(item_str);
        if (month_model !== void 0) {
          hh_usage = month_model.household.get("usage");
          month_model.household.set({
            usage: hh_usage + parseInt(item.bytes)
          });
          user = this.users[item.ipaddr];
          if (user) {
            user_model = month_model.users.get(user);
            if (user_model) {
              user_model.set({
                usage: parseInt(user_model.get("usage")) + parseInt(item.bytes)
              });
            } else {
              user_total_usage = 0;
              month_model.devices.each(__bind(function(device) {
                if (this.users[device.id] === user) {
                  return user_total_usage += device.get("usage");
                }
              }, this));
              month_model.users.add(new models.Allowance({
                id: user,
                usage: user_total_usage,
                allowance: this.user_allowances[user]
              }));
            }
          }
          if (month_model.devices.get(this.devices[item.ipaddr]) != null) {
            device = month_model.devices.get(this.devices[item.ipaddr]);
          } else {
            device = month_model.devices.get(item.ipaddr);
          }
          if (device) {
            device.set({
              usage: parseInt(device.get("usage")) + parseInt(item.bytes)
            });
          } else {
            month_model.devices.add(new models.Allowance({
              id: this.devices[item.ipaddr] || item.ipaddr,
              usage: parseInt(this.ip_usage[item.ipaddr] || 0) + parseInt(item.bytes),
              allowance: parseInt(this.ip_allowances[item.ipaddr])
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
