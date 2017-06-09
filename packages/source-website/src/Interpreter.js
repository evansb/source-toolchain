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
  if (!scopes || ! frames) { return null }
  const content = []
  frames.reverse().forEach((f, idx) => {
    const scope = scopes.get(f)
    let child = null
    if (idx === frames.size - 1) {
      const tableContent = []
      for (const [key, value] of scope.environment.entries()) {
        tableContent.push(
          <tr className="columns" key={key}>
            <td className="col-3">{key}</td>
            <td className="col-9">{valueToString(value)}</td>
          </tr>
        )
      }
      child = (
        <div className="accordion-body">
          <table className="table">
            <tbody>
              {tableContent}
            </tbody>
          </table>
        </div>
      )
    }
    const id = "accordion-" + idx
    content.push(
      <div key={idx} className="accordion-item">
        <input type="radio" id={id} name="accordion-radio" hidden checked={idx === frames.size - 1} />
        <label className="accordion-header hand">{scope.name}</label>
        {child}
      </div>
    )
  })
  return (
    <div className="Section-visualizer-frame">
      <h6>Environments</h6>
      <div className="accordion">
        {content}
      </div>
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
      errors: [],
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
    editor.$blockScrolling = Infinity
    editor.setOptions({
      fontSize: '14px'
    })
    editor.setValue(`
function arithmetic(n) {
  if (n <= 1) {
    return n;
  } else {
    return n + arithmetic(n - 1); 
  }
}

arithmetic(3); 
`)
    editor.clearSelection()

    const session = createSession(3)

    session.on('start', () => {
      this.setState({
        isRunning: true,
        errors: [],
        interpreter: session.interpreter,
        interpreters: [session.interpreter],
        visualizers: [session.visualizer],
        visualizer: session.visualizer,
      })
    })

    editor.on('change', () => {
      this.removeMarkers()
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
      this.setState({ errors })
    })

    session.on('done', () => {
      this.removeMarkers()
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
    const { interpreter, interpreters, visualizer, visualizers } = this.state
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
    const { editor, isRunning, interpreter, errors } = this.state

    if (editor) {
      editor.setReadOnly(isRunning)
    }

    if (editor && interpreter && prevState.interpreter !== interpreter && interpreter.node) {
      const range = new this.Range(
        interpreter.node.loc.start.line - 1,
        interpreter.node.loc.start.column - 1,
        interpreter.node.loc.end.line - 1,
        interpreter.node.loc.end.column,
      )
      this.removeMarkers()
      editor.getSession().addMarker(range, 'Editor-highlight')
    } else if (errors.length !== 0) {
      this.removeMarkers()
      errors.forEach(e => {
        const range = new this.Range(
          e.node.loc.start.line - 1,
          e.node.loc.start.column - 1,
          e.node.loc.end.line - 1,
          e.node.loc.end.column,
        )
        editor.getSession().addMarker(range, 'Editor-highlight-error')
      })
    }
  }

  removeMarkers() {
    const editor = this.state.editor
    const editSession = editor.getSession()
    const markers = editSession.getMarkers()
    Object.keys(markers).forEach(m => editSession.removeMarker(m))
  }

  compareLine = (s1, s2) => {
    if (s1.node.loc.start.line < s2.node.loc.start.line) {
      return -1
    } else if (s1.node.loc.start.line > s2.node.loc.start.line) {
      return 1
    } else if (s1.node.loc.start.column < s2.node.loc.start.column) {
      return -1
    } else if (s1.node.loc.start.column > s2.node.loc.start.column) {
      return 1
    } else {
      return -1
    }
  }

  render() {
    const { session, interpreter, interpreters, visualizer, isRunning, errors } = this.state
    const index = interpreters && interpreter && interpreters.indexOf(interpreter)
    const errorsSection = errors && (errors.length > 0) && (
      <div className="Section-errors column col-6 col-sm-12">
        <h6>Errors</h6>
        {errors.sort(this.compareLine).map((e, idx) => (
          <div key={idx} className="Section-error columns">
            <div className="Section-error-line col-1">{e.node ? e.node.loc.start.line: '<unknown>'}</div>
            <div className="Section-error-explanation col-11">{e.explanation}</div>
          </div>
        ))
        }
      </div>
    )
    const visualizerSection = !errorsSection && isRunning && (
      <div className="Section-visualizer column col-6 col-sm-12">
        <Visualizer visualizer={visualizer} />
        <EnvironmentTable
          scopes={interpreter && interpreter.scopes}
          frames={interpreter && interpreter.frames} />
      </div>
    )
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
        {errorsSection}
        {visualizerSection}
      </div>
    )
  }
}

export default Interpreter
