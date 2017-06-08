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
    isStartOverDisabled, isUntilEndDisabled,
    handleNext, handlePrevious, handleStartOver, handleUntilEnd }) => (
  <div className="Section-control btn-group columns">
    <button onClick={handleStartOver} disabled={isStartOverDisabled}
      className="btn btn-primary">Start</button>
    <button onClick={handleNext} disabled={isNextDisabled}
      className="btn btn-primary">Next</button>
    <button onClick={handlePrevious} disabled={isPreviousDisabled}
      className="btn btn-primary">Previous</button>
  </div>
)

const CurrentExpression = () => (
  <div className="Section-visualizer-expression">
    <h6>Current Expression</h6>
    <div className="columns">
      <button className="btn btn-primary btn-sm">Details</button>
      <pre>4 * factorial(n)</pre>
    </div>
  </div>
)

const EnvironmentVisualizer = () => (
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
)

class SingleStepInterpreter extends Component {

  constructor(props) {
    super(props)
    this.state = {
      editor: null,
      session: null,
      states: [],
      isRunning: false
    }
  }

  setupEditor = async (editorRef) => {
    const ace = await import('brace')
    this.Range = ace.acequire('ace/range').Range
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

    session.on('start', () => {
      this.setState({
        isRunning: true,
        state: session.state,
        states: [session.state]
      })
    })

    session.on('next', () => {
      const state = session.state
      const states = this.state.states.concat([state])
      this.setState({
        isRunning: true,
        state,
        states
      })
    })

    session.on('done', () => {
      const session = editor.getSession()
      const markers = session.getMarkers()
      Object.keys(markers).forEach(m => session.removeMarker(m))
      this.setState({
        isRunning: false
      })
    })

    this.setState({ editor, session })
  }

  handleNext = () => {
    const { session, state, states } = this.state
    if (!session || !session.inProgress) {
      return
    }
    const idx = states.indexOf(state)
    if (states.indexOf(state) !== states.length - 1) {
      this.setState({ state: states[idx + 1] })
    } else {
      session.next()
    }
  }

  handlePrevious = () => {
    const { session, state, states } = this.state
    if (!session || !session.inProgress || states.length <= 1) {
      return
    }
    const index = states.indexOf(state)
    const newState = states[index - 1] || state
    this.setState({ state: newState })
  }

  handleStartOver = () => { 
    const { session } = this.state
    if (!session) {
      return
    }
    session.start(this.state.editor.getValue())
  }

  componentDidUpdate(prevProps, prevState) {
    const { editor, isRunning, state } = this.state

    if (editor) {
      editor.setReadOnly(isRunning)
    }

    if (editor && state && prevState.state !== state && state.node) {
      const session = editor.getSession()
      const markers = session.getMarkers()
      Object.keys(markers).forEach(m => session.removeMarker(m))
      const range = new this.Range(
        state.node.loc.start.line - 1,
        state.node.loc.start.column - 1,
        state.node.loc.end.line - 1,
        state.node.loc.end.column,
      )
      session.addMarker(range, 'Editor-highlight')
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
              <Controls
                isNextDisabled={!this.state.session || !this.state.isRunning}
                isPreviousDisabled={!this.state.session || !this.state.isRunning}
                isStartOverDisabled={!this.state.session}
                isUntilEndDisabled={!this.state.session}
                handleNext={this.handleNext}
                handlePrevious={this.handlePrevious}
                handleStartOver={this.handleStartOver}
              />
              <Editor setupEditor={this.setupEditor} />
            </div>
            <div className="Section-visualizer column col-6 col-sm-12">
              <CurrentExpression />
              <EnvironmentVisualizer />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default SingleStepInterpreter
