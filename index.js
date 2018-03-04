const through = require('through2')
const replaceAll = require('replace-string')

module.exports = function (file) {
  if (!/.vue$/.test(file)) {
    return through()
  }

  return through(function (buf, enc, next) {
    var contents = buf.toString('utf8')

    var templateResult = /<template>([\w\W]*)<\/template>/g.exec(contents)
    var scriptResult = /<script>([\w\W]*)<\/script>/g.exec(contents)

    if (!scriptResult) {
      return this.push(contents)
    }

    var exportResult = /(([^\n]*)export([^\n]*){)/g.exec(scriptResult[1])
    if (!exportResult.length) {
      return this.push(contents)
    }

    var firstPart = scriptResult[1].substring(0, (exportResult.index + exportResult[1].length))
    var templateAddition = `template: "${parseTemplateString(templateResult[1])}",`
    var lastPart = scriptResult[1].substring((exportResult.index + exportResult[1].length) + 1)
    this.push(firstPart + templateAddition + lastPart)

    next()
  })
}

function parseTemplateString (template) {
  var str = replaceAll(template, '\r', '')
  str = replaceAll(str, '\n', '')
  str = replaceAll(str, '\r\n', '')
  str = replaceAll(str, '"', '\\"')

  return str
}
