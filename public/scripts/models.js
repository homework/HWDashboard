(function() {
  var BB, HBS, models, __;
  if (typeof exports !== 'undefined') {
    __ = require('underscore')._;
    BB = require('backbone');
    HBS = require('hbs');
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
      this.household = new models.Allowance({
        id: "household",
        usage: 0
      });
      this.users = new models.Allowances();
      return this.devices = new models.Allowances();
    },
    updateHousehold: function(usage, allowance) {
      var new_usage;
      if (usage == null) {
        usage = 0;
      }
      if (allowance == null) {
        allowance = 0;
      }
      usage = parseInt(usage);
      allowance = parseInt(allowance);
      new_usage = parseInt(this.household.get("usage") || 0) + usage;
      return this.household.set({
        usage: new_usage,
        allowance: allowance
      });
    },
    updateDevice: function(ip, usage, allowance, user) {
      var device_data, new_usage;
      if (usage == null) {
        usage = 0;
      }
      if (allowance == null) {
        allowance = 0;
      }
      if (user == null) {
        user = void 0;
      }
      usage = parseInt(usage);
      allowance = parseInt(allowance);
      console.log("Adding device " + ip + ", usage: " + usage + ", allowance: " + allowance + ", user: " + user);
      new_usage = (parseInt(this.devices.get(ip) ? this.devices.get(ip).get("usage") : false) || 0) + usage;
      device_data = {
        id: ip,
        usage: new_usage,
        allowance: allowance
      };
      if (user != null) {
        device_data['user'] = user;
      }
      if (this.devices.get(ip) != null) {
        console.log("Device exists, setting");
        this.devices.get(ip).set(device_data);
        if (user != null) {
          this.updateUser(user, usage);
        }
      } else {
        console.log("Device doesn't exist, creating");
        this.devices.add(new models.Allowance(device_data));
        console.log(this.devices.get(ip));
        if (user != null) {
          this.updateUser(user, usage, allowance);
        }
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
      console.log("Adding user " + name + ", usage: " + usage + ", allowance: " + allowance);
      new_usage = parseInt(this.users.get(name).get("usage") || 0) + usage;
      new_allowance = parseInt(this.users.get(name).get("allowance") || 0) + allowance;
      user_data = {
        id: name,
        usage: new_usage,
        allowance: new_allowance
      };
      if (this.users.get(name) != null) {
        console.log("User exists, setting");
        return this.users.get(name).set(user_data);
      } else {
        console.log("User doesn't exist, creating");
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
