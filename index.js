const through = require('through2')
const replaceAll = require('replace-string')
const cuid = require('cuid')
const { parseCSS } = require('apply-css')

module.exports = function (file) {
  if (!/.vue$/.test(file)) {
    return through()
  }

  return through(function (buf, enc, next) {
    var contents = buf.toString('utf8')

    var templateResult = /<template>([\w\W]*)<\/template>/g.exec(contents)
    var scriptResult = /<script>([\w\W]*)<\/script>/g.exec(contents)
    var styleResult = /<style([ ]*lang="([a-zA-Z]*)")?([ ]*scoped)?>([\w\W]*?)<\/style>/g.exec(contents)

    if (!scriptResult) {
      return this.push(contents)
    }

    var exportResult = /(([^\n]*)export([^\n]*){)/g.exec(scriptResult[1])
    if (!exportResult.length) {
      return this.push(contents)
    }

    var templateString = templateResult
      ? parseTemplateString(templateResult[1]) : ''

    // scoped style, set scoped attribute
    if (styleResult && styleResult[3]) {
      var insertAtPos = templateString.indexOf('>')
      scopedDataId = cuid.slug()
      templateString = templateString.substring(0, insertAtPos) + ` data-scoped-css=\\"${scopedDataId}\\"` + templateString.substring(insertAtPos)
    }

    // Check if there is a __TEMPLATE__ placeholder, if so just put the
    // compiled template there - otherwise insert a "template" property into
    // the js component
    var placeHolderIndex = scriptResult[1].indexOf('__TEMPLATE__')
    var scriptContents = ''
    var scopedDataId = null

    if (placeHolderIndex > -1) {
      scriptContents = scriptResult[1].replace('__TEMPLATE__', templateString)
    } else {
      var firstPart = scriptResult[1].substring(0, (exportResult.index + exportResult[1].length))
      var lastPart = scriptResult[1].substring((exportResult.index + exportResult[1].length) + 1)
      scriptContents = firstPart + `template: "${templateString}",` + lastPart
    }

    if (styleResult && (!styleResult[2] || styleResult[2] === 'css')) {
      // at the moment only proper css is supported
      if (!styleResult[3]) {
        scriptContents += `\n\nrequire('insert-css')('${styleResult[4].split('\n').join('\\n')}')`
      } else {
        scriptContents += `\n\nrequire('insert-css')('${parseCSS(scopedDataId, styleResult[4]).split('\n').join('\\n')}')`
      }
    }

    this.push(scriptContents)

    next()
  })
}

function parseTemplateString (template) {
  var str = replaceAll(template, '\r', '')
  str = replaceAll(str, '\n', '')
  str = replaceAll(str, '\r\n', '')
  str = replaceAll(str, '"', '\\"')
  str = replaceAll(str, '\'', '\\\'')

  return str
}
