import { Stack } from 'immutable'
import { Instruction, BinaryOp, OpCode } from './instruction'

export interface Runtime {
  popStack(): [any, this]
  pushStack(value: any): this
}

class MutableRuntime implements Runtime {
  stack: Array<any> = new Array()

  popStack() {
    const tup: [any, this] = [this.stack.pop(), this]
    return tup
  }

  pushStack(value) {
    this.stack.push(value)
    return this
  }
}

class ImmutableRuntime implements Runtime {
  stack: Stack<any>

  constructor(stack?: Stack<any>) {
    this.stack = stack || Stack()
  }

  popStack() {
    const value = this.stack.peek()
    const runtime2 = new ImmutableRuntime(this.stack.pop())
    const tup: [any, this] = [runtime2, this]
    return tup
  }

  pushStack(value) {
    return <Runtime>(new ImmutableRuntime(this.stack.push(value)))
  }
}

function applyBinaryOp(binaryOp: BinaryOp, lhs: any, rhs: any): any {
  switch (binaryOp) {
    case BinaryOp.Plus: return lhs + rhs
    case BinaryOp.Minus: return lhs - rhs
    case BinaryOp.Times: return lhs * rhs
    default: throw new Error('Operator not recognized ' + binaryOp)
  }
}

function exBinaryOp(runtime: Runtime, instruction: Instruction): Runtime {
  const binaryOp = <BinaryOp>instruction.$0
  const [$1, runtime0] = runtime.popStack()
  const [$0, runtime1] = runtime0.popStack()
  return runtime1.pushStack(applyBinaryOp(binaryOp, $0, $1))
}

function exPush(runtime: Runtime, instruction: Instruction): Runtime {
  return runtime.pushStack(instruction.$0)
}

function exOneInstruction (runtime: Runtime, instruction: Instruction) {
  switch (instruction.op) {
    case OpCode.BinaryOp: return exBinaryOp(runtime, instruction)
    case OpCode.Push: return exPush(runtime, instruction)
    default: throw new Error('Instruction not recognized ' + instruction.op)
  }
}

export function createMutableRuntime() {
  return new MutableRuntime()
}

export function createImmutableRuntime() {
  return new ImmutableRuntime()
}
