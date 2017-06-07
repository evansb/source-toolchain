import { createSession } from 'source-toolchain'
import React, { Component } from 'react'

class Editor extends Component {

  async componentDidMount() {
    this.props.setupEditor(this.editor)
  }

  render() {
    return <div className="Section-editor" ref={(e) => this.editor = e} />
  }
}

const Description = () => (
  <div className="columns">
    <div className="Section-img-container col-2 col-sm-12">
      <img alt='' className="img-responsive" src="interpreter.png" />
    </div>
    <div className="col-10 col-sm-12">
      <h4>Time-Travelling Interpreter</h4>
      <h6>Evaluates Expression Step-by-Step</h6>
      <p>
        The sandboxed interpreter runs in browsers and NodeJS. Unlike most interpreters and debuggers, it reduces expressions
        step-by-step according to the substitution model. The environment and the stack frame is using immutable data structures,
        making time travelling possible. Interop with JavaScript code is also supported.
      </p>
    </div>
  </div>
)

const Controls = ({ isNextDisabled, isPreviousDisabled,
    handleNext, handlePrevious, handleStartOver, handleUntilEnd }) => (
  <div className="Section-control btn-group columns">
    <button onClick={handleNext} disabled={isNextDisabled}
      className="btn btn-primary">Next</button>
    }
    <button onClick={handlePrevious} disabled={isPreviousDisabled}
      className="btn btn-primary">Previous</button>
    <button onClick={handleStartOver} className="btn btn-primary">Start Over</button>
    <button onClick={handleUntilEnd} className="btn btn-primary">Until End</button>
  </div>
)

class SingleStepInterpreter extends Component {

  constructor(props) {
    super(props)
    this.state = {
      editor: null,
      session: null,
      states: []
    }
  }

  setupEditor = async (editorRef) => {
    const ace = await import('brace')
    await import('brace/mode/javascript')
    await import('ayu-ace')
    const editor = ace.edit(editorRef)
    editor.getSession().setUseWorker(false)
    editor.getSession().setMode('ace/mode/javascript')
    editor.setTheme('ace/theme/ayu-mirage')
    editor.setOptions({
      fontSize: '16px'
    })
    const session = createSession(3)
    this.setState({
      editor, session
    })
  }

  handleNext = () => {
    const { session } = this.state
    if (!session || !session.inProgress) {
      return
    }
    session.next()
    const states = this.state.states.concat([session.state])
    this.setState({
      state: session.state,
      states
    })
  }

  handlePrevious = () => {
    const { session, state, states } = this.state
    if (!session) {
      return
    }
    const index = states.indexOf(state)
    const newState = states[index - 1] || state
    this.setState({
      state: newState
    })
  }

  handleNewState(state) {
    if (state.inProgress) {
      this.editor.setReadOnly(true)
    } else {
      this.editor.setReadOnly(false)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.state !== this.state.state) {
      this.handleNewState(this.state.state)
    }
  }

  render() {
    return (
      <div className="Section">
        <div className="container">
          <Description /> 
          <br />
          <div className="columns">
            <div className="column col-6 col-sm-12">
              <Controls />
              <Editor />
            </div>
            <div className="Section-visualizer column col-6 col-sm-12">
              <div className="Section-visualizer-expression">
                <h6>Current Expression</h6>
                <div className="columns">
                  <button className="btn btn-primary btn-sm">Details</button>
                  <pre>4 * factorial(n)</pre>
                </div>
              </div>
              <div className="Section-visualizer-frame">
                <h6>Environment</h6>
                <div className="Section-visualizer-environment-control columns">
                  <button className="btn btn-primary btn-sm">
                    <i className="icon icon-arrow-left" />
                  </button>
                  <button className="btn btn-primary btn-sm">
                    <i className="icon icon-arrow-right" />
                  </button>
                  <pre>factorial(4)</pre>
                </div>
                <table className="Section-visualizer-environment table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>x</td>
                      <td>4</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SingleStepInterpreter
