import { Observer } from 'rxjs/Observer'
import { Observable } from 'rxjs/Observable'
import { Stack } from 'immutable'
import { Snapshot, State } from './common'

function replaceFirst(snapshot: Snapshot, state: State): Snapshot {
  return <Snapshot> snapshot.set('stateStack',
    snapshot.stateStack.shift().unshift(state))
}

function peekState(snapshot: Snapshot): State {
  return snapshot.stateStack.peek()
}

function peekNode(snapshot: Snapshot): ESTree.Node {
  return snapshot.stateStack.peek().node
}

function visitNode(snapshot: Snapshot, node: ESTree.Node) {
  return unshiftState(snapshot, new State({ node }))
}

function shiftState(snapshot: Snapshot): Snapshot {
  return <Snapshot> snapshot.set('stateStack', snapshot.stateStack.shift())
}

function shiftAndSetValue(snapshot: Snapshot, value: any): Snapshot {
  const head = snapshot.stateStack.shift().peek()
  return <Snapshot> snapshot.set('stateStack',
    snapshot.stateStack.shift().shift().unshift(
      <State> head.set('value', value)
    ))
}

function unshiftState(snapshot: Snapshot, state: State): Snapshot {
  return <Snapshot> snapshot.set('stateStack',
    snapshot.stateStack.unshift(state))
}

export function run(snapshot: Snapshot): Observable<Snapshot> {
  return Observable.create((observer: Observer<Snapshot>) => {
    let currentSnapshot = <Snapshot> snapshot.set('stateStack', Stack.of(
      new State({ node: snapshot.ast })))
    let result: Snapshot
    while (currentSnapshot = step(currentSnapshot)) {
      result = currentSnapshot
      observer.next(currentSnapshot)
    }
    observer.next(<Snapshot> snapshot
       .set('done', true)
       .set('value', peekState(result).value))
    observer.complete()
  })
}

export function step(snapshot: Snapshot): Snapshot {
  if (peekState(snapshot).done) {
    return
  } 
  switch (peekState(snapshot).node.type) {
    case 'Program':
      return stepProgram(snapshot)
    case 'BlockStatement':
      return stepBlockStatement(snapshot)
    case 'Literal':
      return stepLiteral(snapshot)  
    case 'ExpressionStatement':
      return stepExpressionStatement(snapshot)  
    default: return
  }
}

export function stepProgram(snapshot: Snapshot): Snapshot {
  return stepBlockStatement(snapshot)  
}

export function stepBlockStatement(snapshot: Snapshot): Snapshot {
  const state = peekState(snapshot)
  const node = <ESTree.BlockStatement> state.node
  const n = state.n_ || 0
  if (node.body[n]) {
    const snapshot2 = replaceFirst(snapshot,
      <State> state.set('done', false).set('n_', n + 1))
    return visitNode(snapshot2, node.body[n])
  } else {
    const snapshot2 = replaceFirst(snapshot,
      <State> state.set('done', true))
    if (node.type !== 'Program') {
      return shiftState(snapshot2)
    }
    return snapshot2
  }
}

export function stepLiteral(snapshot: Snapshot): Snapshot {
  const node = <ESTree.Literal> peekNode(snapshot)
  const result = shiftAndSetValue(snapshot, node.value)
  return result
}

export function stepExpressionStatement(snapshot: Snapshot): Snapshot {
  const state = peekState(snapshot)
  const node = <ESTree.ExpressionStatement> state.node
  if (!state.done) {
    const snapshot2 = replaceFirst(snapshot, <State> state.set('done', true))
    return visitNode(snapshot2, node.expression)
  } else {
    return <Snapshot> shiftState(snapshot).set('value', state.value)
  }
}
