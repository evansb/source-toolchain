import * as Mustache from 'mustache'
import * as Jison from 'jison'

type GrammarConfig = { [index: string]: boolean }

const minWeek = 3
const maxWeek = 13
const grammarTemplate = require<string>('to-string!raw!./grammar.txt')
const parserCache: { [index: number]: Jison.Parser } = {}

//  5 => { week3: true, week5: true }
function createGrammarConfig (week: number): GrammarConfig {
  const grammarConfig = {}
  for (let w = minWeek; w <= week; w += 1) {
    grammarConfig['week' + w] = true
  }
  return grammarConfig
}

/**
 * Create parser instance that parses Jediscript up to week @week
 * @param  {number}       week the Jediscirpt week
 * @return {Jison.Parser}      the parser
 */
export function createParser (week: number): Jison.Parser {
  if (week < minWeek || week > maxWeek) {
    throw new Error('Parser week ' + week + ' is not available!')
  }
  if (parserCache[week]) {
    return parserCache[week]
  }
  const grammar = Mustache.render(grammarTemplate, createGrammarConfig(week))
  return new Jison.Parser(grammar)
}
