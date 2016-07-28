declare module 'jshint' {   
  namespace jshint {
    export interface IJshint {
      (source: string, options: any): boolean
      data(): any
    }
    export const JSHINT: IJshint
  }
  export = jshint
}
