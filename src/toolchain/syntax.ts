/**
 * Syntax Utilities
 * 
 * @maintainer Evan Sebastian
 */
/**
 * Constants to indicate that feature is banned
 */
export const BANNED = Infinity
 
const syntaxAvailableInWeek = {
  3: {
    BinaryExpression: true,
    BlockStatement: true,
    CallExpression: true,
    ConditionalExpression: true,
    ExpressionStatement: true,
    FunctionDeclaration: true,
    FunctionExpression: true,
    Identifier: true,
    IfStatement: true,
    Literal: true,
    LogicalExpression: true,
    Program: true,
    ReturnStatement: true,
    UnaryExpression: true,
    VariableDeclaration: true,
    VariableDeclarator: true,
  },
  4: {
    EmptyStatement: true
  },
  8: {
    AssignmentExpression: true
  },
  9: {
    MemberExpression: true,
    NewExpression: true,
    ObjectExpression: true,
    Property: true,
    Super: true,
    ThisExpression: true,
    UpdateExpression: true,
  },
  12: {
    ArrayExpression: true,
    BreakStatement: true,
    ContinueStatement: true,
    ForStatement: true,
  },
  [BANNED]: {
    SequenceExpression: true,
    SpreadElement: true,
    ArrowFunctionExpression: true,
    DebuggerStatement: true,
    ClassDeclaration: true,
    ClassExpression: true,
    WithStatement: true,
    YieldExpression: true,
    ExportAllDeclaration: true,
    ExportDefaultDeclaration: true,
    ExportNamedDeclaration: true,
    ExportSpecifier: true,
    ImportDeclaration: true,
    ImportDefaultSpecifier: true,
    ImportNamespaceSpecifier: true,
    ImportSpecifier: true,
    TaggedTemplateExpression: true,
    TemplateElement: true,
    TemplateLiteral: true,
    ClassBody: true,
    ObjectPattern: true,
    CatchClause: true,
    ThrowStatement: true,
    ForOfStatement: true,
    ForInStatement: true,
    ArrayPattern: true,
    MethodDefinition: true,
    DoWhileStatement: true,
    WhileStatement: true,
    AssignmentPattern: true
  }
}

// Compute Minimum week of a syntax type to be available
const minWeekOfSyntaxType: { [type: string]: number } = {}

const keys = Object.keys(syntaxAvailableInWeek)
for (let idx = 0; idx < keys.length; idx += 1) {
  const week = keys[idx]
  const available = syntaxAvailableInWeek[week]
  for (let type of Object.keys(available)) {
    if (week === BANNED.toString()) {
      minWeekOfSyntaxType[type] = BANNED 
    } else {
      minWeekOfSyntaxType[type] = parseInt(week, 10)
    }
  }
}

/**
 * Check whether a syntax tag can be used in week.
 * @param syntax the syntax tag
 * @param week the week
 * @return 'yes', 'no', or 'banned'
 */
export function canUse(syntax: string, week: number = 12): 
  ('yes' | 'no' | 'banned') {
  if (syntaxAvailableInWeek[BANNED][syntax]) {
    return 'banned' 
  } else if (minWeekOfSyntaxType[syntax] <= week) {
    return 'yes'
  } else {
    return 'no'
  }
}

/**
 * Return the minimum week for a syntax to be available.
 * @param syntax the syntax tag
 * @return a week number, or BANNED if the syntax is banned.
 */
export function whenCanUse(syntax: string): number {
  return minWeekOfSyntaxType[syntax] 
}

export const BANNED_OPERATORS = {
  '&': true,
  '|': true,
  '>>': true,
  '<<': true,
  '^': true,
  '~': true,
  '!=': true,
  '==': true
}
