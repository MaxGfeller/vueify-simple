const fs = require('fs')
const path = require('path')
const through = require('through2')
const replaceAll = require('replace-string')
const cuid = require('cuid')
const { parseCSS } = require('apply-css')
const { SourceMapGenerator } = require('source-map')
const convert = require('convert-source-map')

const emptyComponent = 'module.exports = {}'

module.exports = function (file, opts) {
  if (!/.vue$/.test(file)) {
    return through()
  }

  return through(function (buf, enc, next) {
    var contents = buf.toString('utf8')

    var templateResult = /<template>([\w\W]*)<\/template>/g.exec(contents)
    var scriptResult = /<script([ ]*lang="([a-zA-Z]*)" *)?>([\w\W]*)<\/script>/g.exec(contents)

    var styleResult = /<style([ ]*lang="([a-zA-Z]*)")?([ ]*scoped)?>([\w\W]*?)<\/style>/g.exec(contents)
    var map = null

    var parts = file.split('/')
    var ext = scriptResult[2] || 'js'
    var tmpFilePath = getTmpFilePath(parts[parts.length - 1] + `.${ext}`)

    // If there is no script present, create an empty wrapper component
    if (!scriptResult) {
      scriptResult = emptyComponent
    } else {
      var index = scriptResult.index
      var linesBefore = contents.substring(0, index).split('\n')
      scriptResult = scriptResult[3]

      // create source map
      if (opts._flags.debug === true) {
        map = createSourceMap(file, tmpFilePath, scriptResult, contents, linesBefore.length - 1)
        scriptResult += '\n' + convert.fromJSON(map.toString()).toComment()
      }
    }

    fs.writeFileSync(tmpFilePath, scriptResult)

    var templateString = templateResult
      ? parseTemplateString(templateResult[1]) : ''

    // scoped style, set scoped attribute
    var scopedDataId = null
    if (styleResult && styleResult[3]) {
      var insertAtPos = templateString.indexOf('>')
      scopedDataId = cuid.slug()
      templateString = templateString.substring(0, insertAtPos) + ` data-scoped-css=\\"${scopedDataId}\\"` + templateString.substring(insertAtPos)
    }

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

function createSourceMap (sourceFilePath, tmpFilePath, scriptContents, sourceFileContents, offset) {
  var map = new SourceMapGenerator({
    file: tmpFilePath
  })

  var lines = scriptContents.split('\n')
  lines.map((line, i) => {
    map.addMapping({
      source: sourceFilePath,
      original: { line: i + 1 + offset, column: 0 },
      generated: { line: i + 1, column: 0 }
    })
  })

  map.setSourceContent(sourceFilePath, sourceFileContents)
  return map
}
