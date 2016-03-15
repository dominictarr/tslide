#! /usr/bin/env node

require('colors')

var charm = require('charm')(process.stdout)
var keypress = require('keypress')(process.stdin)
var opts = require('optimist').argv
var fs = require('fs')
var iq = require('insert-queue')
var js = require('hipster/highlight/javascript')

var file = opts._[0]
var text = require('fs').readFileSync(file, 'utf-8')
var slides = text.split(/---+\n/)
if(slides.length <= 1) {
  console.error('markdown should be split into slides by --- (hdiv)')
  process.exit(1)
}
//console.log(slides)
//return

var highlight = opts.highlight !== false

var mleft = 5
var mtop  = 2

function show () {
  if(index < 0) index = 0
  if(index >= slides.length) index = slides.length - 1

  var s = stats(slides[index])

  charm
    .reset()
    .position(1, mtop)
    .write(indent(slides[index], mleft))
    .position(mleft, process.stdout.rows - 1)
}
var index = 0
show(index)

process.stdin.setRawMode(true)
process.stdin.resume()

process.stdin.on('keypress', function (ch, key) {

  if(!key) return
  if(key.ctrl && /c|q/.test(key.name))
    charm.reset(), process.exit(0)
  else if(key.name == 'left' || key.name == 'h' || key.name == 'j')
    show(--index)
  else if(key.name == 'right' || key.name == 'k' || key.name == 'l')
    show(index ++)
  else if(key.name == 'home')
    show(index = 0)
  else if(key.name == 'end')
    show(index = slides.length - 1)
})

function stats (slide) {
  var lines = slide.split('\n')
  var max = 0
  lines.forEach(function (line) {
    if(line.length > max)
      max = line.length
  })
  return {
    height: lines.length,
    width:  max
  }
}

function indent(slide, indent) {
  var space = ''
  while (indent--)
    space += ' '

  var code = false
  return slide.split('\n').map(function (l) {
    if(/^#/.test(l))
      l = l.bold
    if(/^```/.test(l))
      code = !code
    if(code && highlight) {
      var q = iq('\t' + l)
      js.highlight(q)
      l = q.apply()
    }
    if(highlight) {
      l = l.replace(/```(.*)?$/gm, '')
    }
    return space + l
  }).join('\n')
}
