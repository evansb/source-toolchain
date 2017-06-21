import { Rule } from '../types/static'

import bracesAroundIfElse from './bracesAroundIfElse'
import noIfWithoutElse from './noIfWithoutElse'
import singleVariableDeclaration from './singleVariableDeclaration'
import strictEquality from './strictEquality'

const rules: Array<Rule<any>> = [
  bracesAroundIfElse,
  singleVariableDeclaration,
  strictEquality,
  noIfWithoutElse
]

export default rules
