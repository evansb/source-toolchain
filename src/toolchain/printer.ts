import { generate } from 'escodegen'
import { ISnapshotError, Any, isUndefined, unbox } from './common'

/**
 * Pretty print snapshot output message
 */
export function printErrorToString(error: ISnapshotError): string { 
  const lines = error.snapshot ? error.snapshot.lines : []
  let header = `${error.message} (line ${error.line} col ${error.column})`
  if (error.endLine) {
    header += ` - (line ${error.endLine} col ${error.endColumn})`
  } 
  let affectedCode = ''
  if (lines.length > 0) {
    const endLine = error.endLine || error.line
    for (var li = error.line; li <= endLine; ++li) { 
      const codeInLine = lines[li - 1]
      affectedCode += codeInLine + '\n'
      if (li === error.line) {
        const leftPadding = Array(error.column).join(' ')
        const rightPaddingLength = (error.endLine === error.line && error.endColumn)
        ? error.endColumn - error.column + 1
        : codeInLine.length - error.column + 1
        const rightPadding = Array(rightPaddingLength).join('-')
        affectedCode += leftPadding + '^' + rightPadding + '\n'
      } else if (li === endLine) {
        const leftPadding = Array(error.endColumn).join('-')
        affectedCode += leftPadding + '^\n'
      }
    }
    affectedCode += '\n'
  }
  return `${header}\n${affectedCode}`
}

export function printValueToString(val: Any, context = {}): string {
  if (val.type === 'function') {
    return generate(val.value)
  } else {
    const value = unbox(val, context)
    if (typeof value.toString === 'function') {
      return value.toString()
    } else if (isUndefined(value)) {
      return 'undefined'
    } else if (typeof value.value === 'object') {
      const cache = []
      return JSON.stringify(value.value, function(key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            return;
          }
          cache.push(value);
        }
      })
    } else {
      return value.value + ''
    }
  }
}
