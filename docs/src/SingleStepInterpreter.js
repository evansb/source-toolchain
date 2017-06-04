import React, { Component } from 'react'

class Editor extends Component {

  async componentDidMount() {
    const ace = await import('brace')
    await import('brace/mode/javascript')
    await import('ayu-ace')
    const editor = ace.edit(this.editor)
    editor.getSession().setUseWorker(false)
    editor.getSession().setMode('ace/mode/javascript')
    editor.setTheme('ace/theme/ayu-mirage')
    editor.setOptions({
      fontSize: '16px'
    })
  }

  render() {
    return <div className="Section-editor" ref={(e) => this.editor = e} />
  }
}

class SingleStepInterpreter extends Component {

  render() {
    return (
      <div className="Section">
        <div className="container">
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
          <br />
          <div className="columns">
            <div className="column col-6 col-sm-12">
              <div className="Section-control btn-group columns">
                <button disabled className="btn btn-primary">Next</button>
                <button disabled className="btn btn-primary">Previous</button>
                <button className="btn btn-primary">Start Over</button>
                <button className="btn btn-primary">Until End</button>
              </div>
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
