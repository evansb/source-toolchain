import { Map } from 'immutable'
import { Subject, Subscription, Scheduler } from '@reactivex/rxjs'

import { Value } from './interop'

export type JSExternals = {
  [name: string]: {
    type: string,
    value: any
  }
}

export interface Snapshot {
  id: number
  completed: boolean
  history: string[]
  bindings?: Map<string, (string | Map<string, string>)>
  tree?: ESTree.Program
  environment?: Map<string, (Value | Map<string, Value>)>
  value?: Value
}

export class SourceContext {
  public lastJobID: number
  private snapshots: Map<number, Snapshot>
  private subject: Subject<Snapshot>

  constructor(
    public week: number,
    private externals: JSExternals) {
    this.subject = new Subject<Snapshot>()
    this.snapshots = Map<number, Snapshot>()
    this.lastJobID = 0
  }

  /**
   * Reset the context's source code.
   * This will abort currently running pipeline and start a new one.
   * @param source the new source code.
   * @return a subscription that cancels the action when unsubscribed.
   */
  recreateProgram(source: string): Subscription {
    this.lastJobID = 0
    this.snapshots = Map<number, Snapshot>()
    return this.appendProgram(source)
  }

  /**
   * Add more code to current context's source code.
   * A new snapshot pipeline will be scheduled.
   * @param source the new source code.
   * @return a subscription that cancels the action when unsubscribed.
   */
  appendProgram(source: string): Subscription {
    const jobID = this.lastJobID
    this.lastJobID++
    const subscription = Scheduler.asap.schedule(() => {
      const snapshot = {
        id: jobID,
        completed: false,
        history: ['source:created']
      }  
      // Everything o.k, commit snapshots
      this.commitSnapshot(snapshot)
    }).add(() => {
      this.snapshots = this.snapshots.delete(jobID)
    })
    return subscription
  }

  /**
   * Subscribe for events. 
   * @param callback the callback fired when a snapshot is changed.
   * @param once set to true if the subscription is cancelled after completed
   *        once or error
   * @return subscription of event and its relevant snapshots. 
   */
  subscribe(callback: (error: Error, snap: Snapshot) => any,
            event: string = '*',
            once: boolean = false): Subscription {
    const subscription = this.subject.subscribe({
      next(snapshot: Snapshot): void {
        callback(null, snapshot)
        if (once) {
          subscription.unsubscribe()
        }
      },
      error(err: Error): void {
        callback(err, null)
        if (once) {
          subscription.unsubscribe()
        }
      }
    })
    return subscription
  }

  /**
   * Return the latest snapshots.
   * Generally not useful outside testing, use pub/sub instead.
   */
  getSnapshot(): any {
    return this.snapshots.toJS()
  }

  private commitSnapshot(snapshot: Snapshot) {
    // Everything o.k, commit snapshots
    snapshot.completed = true
    Object.freeze(snapshot)
    this.snapshots.set(snapshot.id, snapshot)
    this.subject.next(snapshot)
  }
}

      
