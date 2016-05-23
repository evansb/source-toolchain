/*
* This module are meant to be appended to `grammar.txt` after
* compiled to JS
*/
import { createMkOfType, SyntaxType } from './syntax';

export const mkIdentifier = createMkOfType(SyntaxType.Identifier)
export const mkLiteral = createMkOfType(SyntaxType.Literal)
export const mkBinaryExpression = createMkOfType(SyntaxType.BinaryExpression)
export const mkUnaryOperation = createMkOfType(SyntaxType.UnaryOperation)
export const mkLogicalExpression = createMkOfType(SyntaxType.LogicalExpression)
