if(typeof exports isnt 'undefined')
  __ = require('underscore')._
  BB = require('backbone')
  HBS = require('hbs')
else
  BB = Backbone
  __ = _
  HBS = Handlebars

models = this.models = {}

models.Allowance = BB.Model.extend({
  
  initialize: (args) ->
    if (!args.usage)
      @usage = 0

    console.log "Created " + args.id + " allowance"
})

models.Allowances = BB.Collection.extend({
  model: models.Allowance

  initialize: () ->
    console.log "Created Allowances..."

})

models.MonthlyAllowance = BB.Model.extend({

  initialize: (args) ->
    @id = args.id
    @household  = new models.Allowance( { id: "household", allowance: 5000 } )
    @users      = new models.Allowances()
    @devices    = new models.Allowances()

})

models.MonthlyAllowances = BB.Collection.extend({
  model: models.MonthlyAllowance

  initialize: (args) ->
    console.log "Created MonthlyAllowances..."
})

models.DashboardModel = BB.Model.extend({

  initialize: () ->
    @monthlyallowances = new models.MonthlyAllowances()
    console.log "Created dashboard model"

  populateTestData: () ->
    console.log "in"
    @monthlyallowances.add(
      new models.MonthlyAllowance(
        { id: "2011/10" }
      )
    )
    @monthlyallowances.get("2011/10").household =
      new models.Allowance(
        { usage: 3400000000, allowance: 6800000000 }
      )
    @monthlyallowances.add(
      new models.MonthlyAllowance(
        { id: "2011/05" }
      )
    )
    @monthlyallowances.get("2011/05").household =
      new models.Allowance(
        { usage: 33400000000, allowance: 168000000000 }
      )
    @monthlyallowances.get("2011/05").users.add(
      new models.Allowance(
        { id: "Bill", usage: 000000, allowance: 1000000 }
      )
    )
 
    @monthlyallowances.get("2011/10").users.add(
      new models.Allowance(
        { id: "Bill", usage: 400000, allowance: 1000000 }
      )
    )
    @monthlyallowances.get("2011/10").users.add(
      new models.Allowance(
        { id: "Bob", usage: 500000, allowance: 1100000 }
      )
    )
    @monthlyallowances.get("2011/10").devices.add(
      new models.Allowance(
        { id: "Macbook Pro", usage: 100000, allowance: 10000000000 }
      )
    )
    @monthlyallowances.get("2011/10").devices.add(
      new models.Allowance(
        { id: "Android", usage: 600000, allowance: 1100000 }
      )
    )



})
    
BB.Model.prototype.xport = (opt) ->
  result = {}
  settings = __({recurse: true}).extend(opt || {})

  process = (targetObj, source) ->
    targetObj.id = source.id || null
    targetObj.cid = source.cid || null
    targetObj.attrs = source.toJSON()
    __.each(source, (value, key) ->
      if (settings.recurse)
        if (key isnt 'collection' && source[key] instanceof BB.Collection)
          targetObj.collections = targetObj.collections || {}
          targetObj.collections[key] = {}
          targetObj.collections[key].models = []
          targetObj.collections[key].id = source[key].id || null
          __.each(source[key].models, (value, index) ->
            process(targetObj.collections[key].models[index] = {}, value)
          )
        else if (source[key] instanceof BB.Model)
          targetObj.models = targetObj.models || {}
          process(targetObj.models[key] = {}, value)
    )

  process(result, this)
  return JSON.stringify(result)

BB.Model.prototype.mport = (data, silent) ->

  process = (targetObj, data) ->
    targetObj.id = data.id || null
    targetObj.set(data.attrs, {silent: silent})
    if (data.collections)
      __.each(data.collections, (collection, name) ->
        targetObj[name].id = collection.id
        __.each(collection.models, (modelData, index) ->
          newObj = targetObj[name]._add({}, {silent: silent})
          process(newObj, modelData)
        )
      )

    if (data.models)
      __.each(data.models, (modelData, name) ->
        process(targetObj[name], modelData)
      )

  process(this, JSON.parse(data))
  return this

