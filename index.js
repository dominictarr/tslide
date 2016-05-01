#! /usr/bin/env node
require('colors')

var charmer = require('charm')
var keypress = require('keypress')(process.stdin)
var opts = require('optimist').default('images', true).argv
var fs = require('fs')
var path = require('path')
var iq = require('insert-queue')
var js = require('hipster/highlight/javascript')
var imgcat = require('ansi-escapes').image
var http = require('http')

var speaker = opts.speaker || opts.s
var present = opts.present || opts.p
if (speaker && present) {
  console.error('Cannot run tslide as both speaker and presenter.')
  process.exit(1)
}

var file = opts._[0]
if (!file && !present) {
  console.error('USAGE: tslide [markdown-file] [-s|--speaker] [-p|--present]')
  console.error()
  console.error('Pass --speaker to interpret blockquotes as speaker notes. This')
  console.error('will show the full presentation slides in the current terminal.')
  console.error()
  console.error('Run tslide in another terminal with --present. This terminal will')
  console.error('see the same presentation, but without the speaker notes.')
  process.exit(1)
}

var port = 8009

// Connect to the speaker server and stream the response.
if (present) {
  http.request({ port: port }, function (res) {
    res.pipe(process.stdout)
  }).end()
  return
}

var charm = charmer(process.stdout)

var text = require('fs').readFileSync(file, 'utf-8')
var slides = text.split(/---+\n/)
if(slides.length <= 1) {
  console.error('markdown should be split into slides by --- (hdiv)')
  process.exit(1)
}
var notes = []
var presenters = []  // presenter http connections

var highlight = opts.highlight !== false

var mleft = 5
var mtop  = 2

function images (content) {
  var pattern = /^!\[.*?\]\((.*)\)/mg
  var notIterm = !/^iterm/i.test(process.env.TERM_PROGRAM)
  var match
  var image

  if (notIterm) {
    return content
  }

  while (match = pattern.exec(content)) {
    try {
      var url = path.join(__dirname, match[1])

      image = imgcat(fs.readFileSync(url))
      content = content.replace(match[0], image)
    } catch (error) {
      // Either file doesn't exist
      // or terminal doesn't support images
    }
  }

  return content;
}

// Removes all blockquotes from 'slides' and populates 'notes' with them.
function extractNotes () {
  slides = slides.map(function (slide) {
    var res = slide.match(/\s+>.*/)
    if (!res || !res.index) {
      notes.push('')
      return slide
    }
    var idx = res.index
    notes.push(slide.substring(idx))
    return slide.substring(0, idx)
  })
}

// Runs an HTTP server that will serve streaming presentation notes in the
// response.
function serveNotes () {
  http.createServer(function (req, res) {
    var charm = charmer(res)
    presenters.push(charm)
  }).listen(port)
}

// Writes a string to all live HTTP connections.
function writeSlide (slide) {
  presenters.forEach(function (pres) {
    pres
      .reset()
      .position(1, mtop)
      .write(indent(slide, mleft))
      .position(mleft, process.stdout.rows - 1)
  })
}

function show () {
  if(index < 0) index = 0
  if(index >= slides.length) index = slides.length - 1

  var s = stats(slides[index])
  var content = slides[index]

  if (opts.images) {
    content = images(content)
  }

  charm
    .reset()
    .position(1, mtop)
    .write(content, mleft))
    .write(indent(notes[index], mleft))
    .position(mleft, process.stdout.rows - 1)

  writeSlide(slides[index])
}

// Extract notes and run presentation server, if we're the speaker.
if (speaker) {
  extractNotes()
  serveNotes(port)
}

// Start presentation
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
  var inlineBold = /\*\*(.*)\*\*/g
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
