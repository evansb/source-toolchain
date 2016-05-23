import { BinaryOp } from './syntax'

export { BinaryOp }

export enum OpCode {
  BinaryOp,
  Push
}

export interface Instruction {
  op: OpCode
  $0?: any
  $1?: any
  $2?: any
}

export function mkBinaryOp(op: BinaryOp): Instruction {
  if (!BinaryOp[op]) {
    throw new Error('Operator ' + op + ' not defined')
  }
  return {
    op: OpCode.BinaryOp,
    $0: op
  }
}

export function mkPush(value: any): Instruction {
  return {
    op: OpCode.Push,
    $0: value
  }
}
