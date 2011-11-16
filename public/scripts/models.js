(function() {
  var BB, HBS, StreamProxy, client_stream, models, server, __;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  server = typeof exports !== 'undefined' ? true : false;
  if (server) {
    __ = require('underscore')._;
    BB = require('backbone');
    HBS = require('hbs');
    StreamProxy = require('../../lib/streamproxy').streamproxy;
    client_stream = new StreamProxy;
  } else {
    BB = Backbone;
    __ = _;
    HBS = Handlebars;
  }
  models = this.models = {};
  models.Device = BB.Model.extend({
    initialize: function(args) {
      return console.log("Created " + args.id + " device");
    }
  });
  models.Allowance = BB.Model.extend({
    initialize: function(args) {
      ({
        defaults: {
          usage: 0,
          allowance: -1
        }
      });
      return console.log("Created " + args.id + " allowance");
    }
  });
  models.Allowances = BB.Collection.extend({
    model: models.Allowance,
    initialize: function() {
      return console.log("Created Allowances...");
    }
  });
  models.MonthlyAllowance = BB.Model.extend({
    initialize: function(args) {
      this.id = args.id;
      this.socket = args.socket;
      this.household = new models.Allowance({
        id: "household",
        usage: 0
      });
      this.users = new models.Allowances();
      this.devices = new models.Allowances();
      this.changeTimer = 0;
      this.household.bind("change", __bind(function() {
        if (server) {
          return this.setChangeTimer();
        }
      }, this));
      this.users.bind("change", __bind(function() {
        if (server) {
          return this.setChangeTimer();
        }
      }, this));
      return this.devices.bind("change", __bind(function() {
        if (server) {
          return this.setChangeTimer();
        }
      }, this));
    },
    setChangeTimer: function() {
      clearTimeout(this.changeTimer);
      return this.changeTimer = setTimeout(__bind(function() {
        return client_stream.push("allowances", "updateView", {
          id: this.id,
          model: this.xport()
        });
      }, this), 1000);
    },
    updateHousehold: function(usage, allowance) {
      var current_usage, household_data, total_usage;
      if (usage == null) {
        usage = 0;
      }
      if (allowance == null) {
        allowance = 0;
      }
      usage = parseInt(usage);
      allowance = parseInt(allowance);
      current_usage = parseInt(this.household.get("usage"));
      total_usage = current_usage + usage;
      household_data = {
        usage: total_usage
      };
      if (allowance > 0) {
        household_data['allowance'] = allowance;
      }
      return this.household.set(household_data);
    },
    updateDevice: function(ip, usage, allowance, name, user) {
      var device_data, device_exists, new_usage;
      if (usage == null) {
        usage = 0;
      }
      if (allowance == null) {
        allowance = 0;
      }
      if (name == null) {
        name = void 0;
      }
      if (user == null) {
        user = void 0;
      }
      usage = parseInt(usage);
      allowance = parseInt(allowance);
      device_exists = this.devices.get(ip) != null;
      new_usage = parseInt((device_exists ? this.devices.get(ip).get("usage") : false) || 0) + usage;
      device_data = {
        id: ip,
        usage: new_usage
      };
      if (allowance > 0) {
        device_data['allowance'] = allowance;
      }
      if (name != null) {
        device_data['name'] = name;
      }
      if (user != null) {
        device_data['user'] = user;
      } else {
        user = device_exists ? this.devices.get(ip).get("user") || void 0 : void 0;
      }
      if (this.devices.get(ip) != null) {
        this.devices.get(ip).set(device_data);
      } else {
        this.devices.add(new models.Allowance(device_data));
      }
      if (user != null) {
        this.updateUser(user, usage, allowance);
      }
      return this.updateHousehold(usage);
    },
    updateUser: function(name, usage, allowance) {
      var new_allowance, new_usage, user_data;
      if (usage == null) {
        usage = 0;
      }
      if (allowance == null) {
        allowance = 0;
      }
      usage = parseInt(usage);
      allowance = parseInt(allowance);
      new_usage = parseInt((this.users.get(name) ? this.users.get(name).get("usage") : false) || 0) + usage;
      new_allowance = parseInt((this.users.get(name) ? this.users.get(name).get("allowance") : false) || 0) + allowance;
      user_data = {
        id: name,
        usage: new_usage
      };
      if (allowance > 0) {
        user_data['allowance'] = new_allowance;
      }
      if (this.users.get(name) != null) {
        return this.users.get(name).set(user_data);
      } else {
        return this.users.add(new models.Allowance(user_data));
      }
    }
  });
  models.MonthlyAllowances = BB.Collection.extend({
    model: models.MonthlyAllowance,
    initialize: function(args) {
      return console.log("Created MonthlyAllowances...");
    }
  });
  models.DashboardModel = BB.Model.extend({
    initialize: function() {
      this.monthlyallowances = new models.MonthlyAllowances();
      return console.log("Created dashboard model");
    },
    populateTestData: function() {
      console.log("in");
      this.monthlyallowances.add(new models.MonthlyAllowance({
        id: "2011/10"
      }));
      this.monthlyallowances.get("2011/10").household = new models.Allowance({
        usage: 0,
        allowance: 6800000000
      });
      this.monthlyallowances.add(new models.MonthlyAllowance({
        id: "2011/05"
      }));
      this.monthlyallowances.get("2011/05").household = new models.Allowance({
        usage: 33400000000,
        allowance: 168000000000
      });
      this.monthlyallowances.get("2011/05").users.add(new models.Allowance({
        id: "Bill",
        usage: 000000,
        allowance: 1000000
      }));
      this.monthlyallowances.get("2011/10").users.add(new models.Allowance({
        id: "Bill",
        usage: 400000,
        allowance: 1000000
      }));
      this.monthlyallowances.get("2011/10").users.add(new models.Allowance({
        id: "Bob",
        usage: 500000,
        allowance: 1100000
      }));
      this.monthlyallowances.get("2011/10").devices.add(new models.Allowance({
        id: "Macbook Pro",
        usage: 100000,
        allowance: 10000000000
      }));
      return this.monthlyallowances.get("2011/10").devices.add(new models.Allowance({
        id: "Android",
        usage: 600000,
        allowance: 1100000
      }));
    }
  });
  BB.Model.prototype.xport = function(opt) {
    var process, result, settings;
    result = {};
    settings = __({
      recurse: true
    }).extend(opt || {});
    process = function(targetObj, source) {
      targetObj.id = source.id || null;
      targetObj.cid = source.cid || null;
      targetObj.attrs = source.toJSON();
      return __.each(source, function(value, key) {
        if (settings.recurse) {
          if (key !== 'collection' && source[key] instanceof BB.Collection) {
            targetObj.collections = targetObj.collections || {};
            targetObj.collections[key] = {};
            targetObj.collections[key].models = [];
            targetObj.collections[key].id = source[key].id || null;
            return __.each(source[key].models, function(value, index) {
              return process(targetObj.collections[key].models[index] = {}, value);
            });
          } else if (source[key] instanceof BB.Model) {
            targetObj.models = targetObj.models || {};
            return process(targetObj.models[key] = {}, value);
          }
        }
      });
    };
    process(result, this);
    return JSON.stringify(result);
  };
  BB.Model.prototype.mport = function(data, silent) {
    var process;
    process = function(targetObj, data) {
      targetObj.id = data.id || null;
      targetObj.set(data.attrs, {
        silent: silent
      });
      if (data.collections) {
        __.each(data.collections, function(collection, name) {
          targetObj[name].id = collection.id;
          return __.each(collection.models, function(modelData, index) {
            var newObj;
            newObj = targetObj[name]._add({}, {
              silent: silent
            });
            return process(newObj, modelData);
          });
        });
      }
      if (data.models) {
        return __.each(data.models, function(modelData, name) {
          return process(targetObj[name], modelData);
        });
      }
    };
    process(this, JSON.parse(data));
    return this;
  };
}).call(this);
