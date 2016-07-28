import { ISnapshotMessage } from './common'

/**
 * Pretty print snapshot output message
 */
export function printToString(
  message: ISnapshotMessage,
  withHeader: boolean = true
): string {
  let errors: string = message.results.reduce((previous, current, index) => { 
    let header = `${current.message} (line ${current.line} col ${current.column})` // tslint:disable-line
    if (current.endLine) {
      header += ` - (line ${current.endLine} col ${current.endColumn})`
    }
    const lines = message.code.split('\n')
    const endLine = current.endLine || current.line
    let affectedCode = ''
    for (var li = current.line; li <= endLine; ++li) { 
      const codeInLine = lines[li - 1]
      affectedCode += codeInLine + '\n'
      if (li === current.line) {
        const leftPadding = Array(current.column).join(' ')
        const rightPadding = Array(codeInLine.length - current.column + 1)
          .join('-')
        affectedCode += leftPadding + '^' + rightPadding + '\n'
      } else if (li === endLine) {
        const leftPadding = Array(current.endColumn).join('-')
        affectedCode += leftPadding + '^\n'
      }
    }
    return previous + `${header}\n${affectedCode}\n`
  }, '')
  if (withHeader && errors.length > 0 && message.header) {
    errors = message.header + '\n' + errors
  }
  return errors
}
