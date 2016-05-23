declare module 'jison' {
  interface JisonMap {
    [s: number]: string
  }
  interface JisonLex {
    rules: Array<JisonMap>
  }
  interface JisonBNF {
    start: Array<JisonMap>;
    input: Array<JisonMap>;
    line: Array<JisonMap>;
    exp: Array<JisonMap>;
    operator: Array<JisonMap>;
  }
  class Parser {
    yy: any;
    constructor(configuration: {lex: JisonLex; bnf: JisonBNF} | string);
    parse(input: string): any;
  }
}
