const fs = require('fs')
const path = require('path')
const through = require('through2')
const replaceAll = require('replace-string')
const cuid = require('cuid')
const { parseCSS } = require('apply-css')

const emptyComponent = 'module.exports = {}'

module.exports = function (file) {
  if (!/.vue$/.test(file)) {
    return through()
  }

  return through(function (buf, enc, next) {
    var contents = buf.toString('utf8')

    var templateResult = /<template>([\w\W]*)<\/template>/g.exec(contents)
    var scriptResult = /<script>([\w\W]*)<\/script>/g.exec(contents)
    var styleResult = /<style([ ]*lang="([a-zA-Z]*)")?([ ]*scoped)?>([\w\W]*?)<\/style>/g.exec(contents)

    // If there is no script present, create an empty wrapper component
    if (!scriptResult) {
      scriptResult = emptyComponent
    } else {
      scriptResult = scriptResult[1]
    }

    var templateString = templateResult
      ? parseTemplateString(templateResult[1]) : ''

    // scoped style, set scoped attribute
    var scopedDataId = null
    if (styleResult && styleResult[3]) {
      var insertAtPos = templateString.indexOf('>')
      scopedDataId = cuid.slug()
      templateString = templateString.substring(0, insertAtPos) + ` data-scoped-css=\\"${scopedDataId}\\"` + templateString.substring(insertAtPos)
    }

    var parts = file.split('/')
    // TODO: parse extension from lang="" attribute in script tag
    var tmpFilePath = getTmpFilePath(parts[parts.length - 1] + '.js')
    fs.writeFileSync(tmpFilePath, scriptResult)

    var wrapperContent = `var content = require('./${tmpFilePath}')\n`
    wrapperContent += `content.template = '${templateString}'\n`
    wrapperContent += `module.exports = content\n`

    if (styleResult && (!styleResult[2] || styleResult[2] === 'css')) {
      // at the moment only proper css is supported
      if (!styleResult[3]) {
        wrapperContent += `\n\nrequire('insert-css')('${styleResult[4].split('\n').join('\\n')}')`
      } else {
        wrapperContent += `\n\nrequire('insert-css')('${parseCSS(scopedDataId, styleResult[4]).split('\n').join('\\n')}')`
      }
    }

    var { atimeMs } = fs.statSync(tmpFilePath)

    this.push(wrapperContent)
    next()

    var rmInterval = setInterval(() => {
      var stat = null
      try {
        stat = fs.statSync(tmpFilePath)
      } catch (e) {
        if (rmInterval) clearInterval(rmInterval)
        return
      }
      if (stat.atimeMs === atimeMs) return

      clearInterval(rmInterval)
      fs.unlink(tmpFilePath, () => {})
    }, 200)
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

function getTmpFilePath (fileName) {
  var fileNameParts = fileName.split('.')
  var ext = fileNameParts.pop()
  var fileNameWithoutExt = fileNameParts.join('')
  var tmpFileName = `${fileNameWithoutExt}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`
  return path.relative(__dirname, path.join(__dirname, tmpFileName))
}
