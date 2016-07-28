/// <reference path='./espree.d.ts' />
declare module 'eslint' {   
  namespace eslint {
    export type LinterConfig = Object

    interface OptionsOrFilename {
      filename?: string
      saveState?: boolean
      allowInlineConfig?: boolean
    }

    export interface LinterError {
      column: number,
      fatal: boolean, 
      line: number,
      message: string,
      nodeType: string,
      ruleId?: string,
      severity: number,
      source: number | string,
      endColumn: number,
      endLine: number,
      fix: {
        range: [number, number],
        text: string
      }
    }

    export type LinterResult = LinterError[]

    export interface Linter {
      getSourceCode(): SourceCode
      verify(code: string,
             config: LinterConfig,
             optionsOrFilename?: OptionsOrFilename | string): LinterResult
    }

    export const linter: Linter

    export class SourceCode { 
      hasBOM: boolean
      text: string
      static splitLines(code: string): string[]
      constructor(code: string, ast: ESTree.Program)
    }
  }
  export = eslint
}
