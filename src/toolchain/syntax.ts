// Map Esprima Syntax type tag to availability.
// Please consult the language specification before modifying those.
import { Syntax as S } from 'esprima'

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
    [S.BinaryExpression]: true,
    [S.BlockStatement]: true,
    [S.CallExpression]: true,
    [S.ConditionalExpression]: true,
    [S.ExpressionStatement]: true,
    [S.FunctionDeclaration]: true,
    [S.FunctionExpression]: true,
    [S.Identifier]: true,
    [S.IfStatement]: true,
    [S.Literal]: true,
    [S.LogicalExpression]: true,
    [S.Program]: true,
    [S.ReturnStatement]: true,
    [S.UnaryExpression]: true,
    [S.VariableDeclaration]: true,
    [S.VariableDeclarator]: true,
  },
  4: {
    [S.EmptyStatement]: true
  },
  5: {
    [S.ArrayExpression]: true,
  },
  8: {
    [S.AssignmentExpression]: true
  },
  9: {
    [S.MemberExpression]: true,
    [S.NewExpression]: true,
    [S.ObjectExpression]: true,
    [S.Property]: true,
    [S.Super]: true,
    [S.ThisExpression]: true,
    [S.UpdateExpression]: true,
  },
  12: {
    [S.BreakStatement]: true,
    [S.ContinueStatement]: true,
    [S.ForStatement]: true,
  },
  [BANNED]: {
    [S.SequenceExpression]: true,
    [S.SpreadElement]: true,
    [S.ArrowFunctionExpression]: true,
    [S.DebuggerStatement]: true,
    [S.ClassDeclaration]: true,
    [S.ClassExpression]: true,
    [S.WithStatement]: true,
    [S.YieldExpression]: true,
    [S.ExportAllDeclaration]: true,
    [S.ExportDefaultDeclaration]: true,
    [S.ExportNamedDeclaration]: true,
    [S.ExportSpecifier]: true,
    [S.ImportDeclaration]: true,
    [S.ImportDefaultSpecifier]: true,
    [S.ImportNamespaceSpecifier]: true,
    [S.ImportSpecifier]: true,
    [S.TaggedTemplateExpression]: true,
    [S.TemplateElement]: true,
    [S.TemplateLiteral]: true,
    [S.ClassBody]: true,
    [S.ObjectPattern]: true,
    [S.CatchClause]: true,
    [S.ThrowStatement]: true,
    [S.ForOfStatement]: true,
    [S.ForInStatement]: true,
    [S.ArrayPattern]: true,
    [S.MethodDefinition]: true,
    [S.DoWhileStatement]: true,
    [S.WhileStatement]: true,
    [S.AssignmentPattern]: true
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
export function canUseSyntax(syntax: string,
                             week: number = 12): ('yes' | 'no' | 'banned') {
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
export function whenCanUseSyntax(syntax: string): number {
  return minWeekOfSyntaxType[syntax] 
}
