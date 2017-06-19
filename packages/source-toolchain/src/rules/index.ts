import { Rule } from '../types/static'

import bracesAroundIfElse from './bracesAroundIfElse'
import missingElse from './missingElse'
import singleVariableDeclaration from './singleVariableDeclaration'
import strictEquality from './strictEquality'

const rules: Array<Rule<any>> = [
  bracesAroundIfElse,
  singleVariableDeclaration,
  strictEquality,
  missingElse
]

export default rules
