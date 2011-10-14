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
      if (!args.usage) {
        this.set({
          usage: 0
        });
      }
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
        id: "household"
      });
      this.users = new models.Allowances();
      this.devices = new models.Allowances();
      return this.lastUpdated = new Date().getTime();
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
