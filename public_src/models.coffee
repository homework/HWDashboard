server = if (typeof exports isnt 'undefined') then true else false

if server
  __ = require('underscore')._
  BB = require('backbone')
  HBS = require('hbs')
  StreamProxy = require('../../lib/streamproxy').streamproxy
  client_stream = new StreamProxy
  #client_stream.setup()
else
  BB = Backbone
  __ = _
  HBS = Handlebars

models = this.models = {}

models.Device = BB.Model.extend({

  initialize: (args) ->
    console.log "Created " + args.id + " device"

})

models.Allowance = BB.Model.extend({
  
  initialize: (args) ->

    defaults: {
      usage:      0
      allowance:  -1
    }

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
    @socket = args.socket
    @household  = new models.Allowance( { id: "household", usage: 0 } )
    @users      = new models.Allowances()
    @devices    = new models.Allowances()
    @changeTimer = 0

    @household.bind "change", =>
      if server then @setChangeTimer()

    @users.bind "change", =>
      if server then @setChangeTimer()

    @devices.bind "change", =>
      if server then @setChangeTimer()

  setChangeTimer: ->

    clearTimeout(@changeTimer)

    @changeTimer = setTimeout( =>
      client_stream.push "allowances", "updateView", { id: @id, model: @.xport() }
    ,1000)


  # (usage)                 -> Increment usage
  # (usage || 0, allowance) -> Set allowance
  updateHousehold: (usage=0, allowance=0) ->

    usage     = parseInt(usage)
    allowance = parseInt(allowance)

    current_usage = parseInt(@household.get("usage"))
    total_usage   = current_usage + usage

    household_data = { usage: total_usage }

    if allowance > 0
      household_data['allowance'] = allowance

    @household.set household_data

  # (ip, usage)                             -> Increment usage
  # (ip, usage || 0, allowance)             -> Set allowance
  # (ip, usage || 0, allowance || 0, name)  -> Set name of user
  # (ip, usage || 0, allowance || 0, name, user)  -> Set name of user
  updateDevice: (ip, usage=0, allowance=0, name=undefined, user=undefined) ->

    usage     = parseInt(usage)
    allowance = parseInt(allowance)

    device_exists = @devices.get(ip)?

    new_usage = parseInt( (if device_exists then @devices.get(ip).get("usage") else false) || 0) + usage

    device_data = {
                    id:         ip
                    usage:      new_usage
                  }

    if allowance > 0
      device_data['allowance'] = allowance

    if name?
      device_data['name'] = name
    if user?
      device_data['user'] = user
    else
      user = if device_exists then (@devices.get(ip).get("user") || undefined)

    if @devices.get(ip)?
      @devices.get(ip).set device_data
    else
      @devices.add( new models.Allowance device_data )

    if user? then @updateUser(user, usage, allowance)

    @updateHousehold usage

  # NOTE: Incrementing usage should ONLY be called from within updateDevice
  #       All external calls should pass a value of 0
  #       Failure to follow this standard will cause inconsistencies across 
  #       user and household usage data
  #
  # (name, usage)                 -> Increment usage
  # (name, usage || 0, allowance) -> Increment usage and allowance
  updateUser: (name, usage=0, allowance=0) ->

    usage     = parseInt(usage)
    allowance = parseInt(allowance)

    new_usage     = parseInt( (if @users.get(name) then @users.get(name).get("usage") else false) || 0) + usage
    new_allowance = parseInt( (if @users.get(name) then @users.get(name).get("allowance") else false) || 0) + allowance

    user_data = {
                  id:         name
                  usage:      new_usage
    }

    if allowance > 0
      user_data['allowance'] = new_allowance

    if @users.get(name)?
      @users.get(name).set user_data
    else
      @users.add( new models.Allowance user_data )

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
        { usage: 0, allowance: 6800000000 }
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
