const syntaxTypes: { [nodeName: string]: number } = {
  // Week 3
  Program: 3,
  ExpressionStatement: 3,
  IfStatement: 3,
  FunctionDeclaration: 3,
  VariableDeclaration: 3,
  ReturnStatement: 3,
  CallExpression: 3,
  UnaryExpression: 3,
  BinaryExpression: 3,
  LogicalExpression: 3,
  ConditionalExpression: 3,
  FunctionExpression: 3,
  Identifier: 3,
  Literal: 3,

  // Week 5
  EmptyStatement: 5,

  // Week 6
  AssignmentExpression: 6,

  // Week 8
  ThisExpression: 8,
  ObjectExpression: 8,
  Property: 8,
  UpdateExpression: 8,
  MemberExpression: 8,
  NewExpression: 8,

  // Week 12
  ArrayExpression: 12,
  WhileStatement: 12,
  BreakStatement: 12,
  ContinueStatement: 12,
  ForStatement: 12,

  // Disallowed Forever
  SwitchStatement: Infinity,
  DebuggerStatement: Infinity,
  WithStatement: Infinity,
  LabeledStatement: Infinity,
  SwitchCase: Infinity,
  ThrowStatement: Infinity,
  CatchClause: Infinity,
  DoWhileStatement: Infinity,
  ForInStatement: Infinity,
  SequenceExpression: Infinity
}

export default syntaxTypes
