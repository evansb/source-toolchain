import { Rule } from '../types/static'

import bracesAroundIfElse from './bracesAroundIfElse'
import noIfWithoutElse from './noIfWithoutElse'
import singleVariableDeclaration from './singleVariableDeclaration'
import strictEquality from './strictEquality'
import noImplicitDeclareUndefined from './noImplicitDeclareUndefined'
import noImplicitReturnUndefined from './noImplicitReturnUndefined'

const rules: Array<Rule<any>> = [
  bracesAroundIfElse,
  singleVariableDeclaration,
  strictEquality,
  noIfWithoutElse,
  noImplicitDeclareUndefined,
  noImplicitReturnUndefined
]

export default rules
