import { createSession } from 'source-toolchain'
import { generate } from 'escodegen'
import React, { Component } from 'react'

class Editor extends Component {

  async componentDidMount() {
    await this.props.setupEditor(this.editor)
  }

  render() {
    return <div className="Section-editor" ref={(e) => this.editor = e} />
  }
}

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

const Visualizer = ({ visualizer }) => (
  <div className="Section-visualizer-expression">
    <h6>Current Expression</h6>
    <div className="columns">
      { visualizer && visualizer.root && <pre>{generate(visualizer.root)}</pre> }
    </div>
  </div>
)

const valueToString = (v) => {
  if (v.constructor && v.constructor.name === 'Closure') {
    return v.node.id ? `<function ${v.node.id.name}>` : '<lambda>'
  } else {
    return v.toString()
  }
}

const EnvironmentTable = ({ scopes, frames }) => {
  const scope = scopes && frames && scopes.get(frames.first())
  const content = []
  if (scope) {
    for (const [key, value] of scope.environment.entries()) {
      content.push(
        <tr key={key}>
          <td>{key}</td>
          <td>{valueToString(value)}</td>
        </tr>
      )
    }
  }
  return (
    <div className="Section-visualizer-frame">
      <h6>Environment</h6>
      <div className="Section-visualizer-environment-control columns">
        <button className="btn btn-primary btn-sm">
          <i className="icon icon-arrow-left" />
        </button>
        <button className="btn btn-primary btn-sm">
          <i className="icon icon-arrow-right" />
        </button>
        <pre>{scope && scope.name}</pre>
      </div>
      <table className="Section-visualizer-environment table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {content}
        </tbody>
      </table>
    </div>
  )
}

class Interpreter extends Component {

  constructor(props, context) {
    super(props, context)
    this.state = {
      editor: null,
      session: null,
      visualizer: null,
      interpreter: null,
      interpreters: [],
      visualizers: [],
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
        interpreter: session.interpreter,
        interpreters: [session.interpreter],
        visualizers: [session.visualizer],
        visualizer: session.visualizer,
      })
    })

    session.on('next', () => {
      const { interpreter, visualizer } = session
      const { interpreters, visualizers } = this.state

      this.setState({
        isRunning: true,
        interpreter,
        visualizer,
        interpreters: interpreters.concat([interpreter]),
        visualizers: visualizers.concat([visualizer])
      })
    })

    session.on('errors', (errors) => {
      console.log(errors)
    })

    session.on('done', () => {
      const editSession = editor.getSession()
      const markers = editSession.getMarkers()
      Object.keys(markers).forEach(m => editSession.removeMarker(m))
      this.setState({ isRunning: false })
    })

    this.setState({ editor, session })
  }

  handleNext = () => {
    const { session, interpreter, interpreters, visualizers } = this.state
    const index = interpreters.indexOf(interpreter)
    if (index !== interpreters.length - 1) {
      this.setState({
        interpreter: interpreters[index + 1],
        visualizer: visualizers[index + 1]
      })
    } else {
      session.next()
    }
  }

  handlePrevious = () => {
    const { session, interpreter, interpreters, visualizer, visualizers } = this.state
    const index = interpreters.indexOf(interpreter)
    this.setState({
      interpreter: interpreters[index - 1] || interpreter,
      visualizer: visualizers[index - 1] || visualizer
    })
  }

  handleStartOver = () => { 
    const { session, editor } = this.state
    if (session) {
      session.start(editor.getValue())
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { editor, isRunning, interpreter } = this.state

    if (editor) {
      editor.setReadOnly(isRunning)
    }

    if (editor && interpreter && prevState.interpreter !== interpreter && interpreter.node) {
      const editSession = editor.getSession()
      const markers = editSession.getMarkers()
      Object.keys(markers).forEach(m => editSession.removeMarker(m))
      const range = new this.Range(
        interpreter.node.loc.start.line - 1,
        interpreter.node.loc.start.column - 1,
        interpreter.node.loc.end.line - 1,
        interpreter.node.loc.end.column,
      )
      editSession.addMarker(range, 'Editor-highlight')
    }
  }

  render() {
    const { session, interpreter, interpreters, visualizer, isRunning } = this.state
    const index = interpreters && interpreter && interpreters.indexOf(interpreter)
    return (
      <div className="columns">
        <div className="column col-6 col-sm-12">
          <Controls
            isNextDisabled={!session || !isRunning}
            isPreviousDisabled={!session || !isRunning || !index || index <= 0}
            isStartOverDisabled={!session}
            isUntilEndDisabled={!session}
            handleNext={this.handleNext}
            handlePrevious={this.handlePrevious}
            handleStartOver={this.handleStartOver}
          />
          <Editor setupEditor={this.setupEditor} />
        </div>
        <div className="Section-visualizer column col-6 col-sm-12">
          <Visualizer visualizer={visualizer} />
          <EnvironmentTable
            scopes={interpreter && interpreter.scopes}
            frames={interpreter && interpreter.frames} />
        </div>
      </div>
    )
  }
}

export default Interpreter
