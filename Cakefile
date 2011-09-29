fs     = require 'fs'
{exec} = require 'child_process'
util   = require 'util'
uglify = require './node_modules/uglify-js'

appFiles = [
#    'src/server/blank.coffee',
    'src/logger.coffee',
    'src/hwdbparser.coffee',
    'src/defragger.coffee',
    'src/packeteer.coffee',
    'src/jsrpc.coffee',
    'src/hwdbservice.coffee',
]

task 'coffeeFiles', 'how much coffee you got?!', ->
  traverseFileSystem = (currentPath) ->
      files = fs.readdirSync currentPath
      for file in files
        do (file) ->
          currentFile = currentPath + '/' + file
          stats = fs.statSync(currentFile)
          if stats.isFile() and currentFile.indexOf('.coffee') > 1 and appFiles.join('=').indexOf("#{currentFile}=") < 0
            appFiles.push currentFile
          else if stats.isDirectory()
            traverseFileSystem currentFile

  traverseFileSystem 'src'
  util.log "#{appFiles.length} coffee files found."
  return appFiles

task 'watch', 'Watch prod source files and build changes', ->
    invoke 'build'
    util.log "Watching for changes in src"

    for file in appFiles then do (file) ->
        fs.watchFile file, (curr, prev) ->
            if +curr.mtime isnt +prev.mtime
                util.log "Saw change in #{file}"
                invoke 'build'

task 'build', 'Build single application file from source files', ->
  #invoke 'coffeeFiles'
  appContents = new Array remaining = appFiles.length
  for file, index in appFiles then do (file, index) ->
    fs.readFile file, 'utf8', (err, fileContents) ->
      throw err if err
      appContents[index] = fileContents
      process() if --remaining is 0
  process = ->
    fs.writeFile 'lib/dashboard.coffee', appContents.join('\n\n'), 'utf8', (err) ->
      throw err if err
      exec 'coffee --compile lib/dashboard.coffee', (err, stdout, stderr) ->
        if err
          util.log 'Error compiling coffee file.'
        else
          fs.unlink 'lib/dashboard.coffee', (err) ->
            if err
              util.log 'Couldn\'t delete the app.coffee file/'
            util.log 'Done building coffee file.'
