import { generate } from 'astring';
import React, { Component } from 'react';
import Editor from './Editor';
import InterpreterControl from './InterpreterControl';

const Visualizer = ({ visualizer }) =>
  <div className="Section-visualizer-expression">
    <style jsx>
      {`
        pre {
          color: white;
          width: 100%;
          font-weight: 500;
          margin: 0px 10px;
          padding: 5px 10px;
          background: #5764c6;
          font-weight: 700;
          font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
        }
      `}
    </style>
    <div className="columns">
      {visualizer &&
        visualizer.root &&
        <pre>
          {generate(visualizer.root)}
        </pre>}
    </div>
  </div>;

const valueToString = v => {
  if (v.node && v.node.id && v.node.id.name) {
    return v.node.id ? `<function ${v.node.id.name}>` : '<lambda>';
  } else {
    return v.toString();
  }
};

const EnvironmentTable = ({ scopes, frames }) => {
  if (!scopes || !frames) {
    return null;
  }
  const content = [];
  frames.reverse().forEach((f, idx) => {
    const scope = scopes.get(f);
    let child = null;
    if (idx === frames.size - 1) {
      const tableContent = [];
      for (const [key, value] of scope.environment.entries()) {
        tableContent.push(
          <tr className="columns" key={key}>
            <style jsx>{`
              td {
                background: #454d5d;
                padding: 5px 10px;
                border-bottom: none;
                border-right: 3px solid black;
              }
            `}</style>
            <td className="col-5">
              {key}
            </td>
            <td className="col-7">
              {valueToString(value)}
            </td>
          </tr>
        );
      }
      child = (
        <div className="accordion-body">
          <table className="table">
            <tbody>
              {tableContent}
            </tbody>
          </table>
        </div>
      );
    }
    const id = 'accordion-' + idx;
    content.push(
      <div key={idx} className="accordion-item">
        <style jsx>{`
          div {
            color: white;
          }
          .accordion-header {
            font-family: 'Menlo', 'Consolas', monospace;
            background: #222436 !important;
            color: white;
            border-left: 5px solid #5764c6;
            border-top: 1px solid #5764c6;
          }
          .accordion-body {
            font-family: 'Menlo', 'Consolas', monospace;
            color: white !important;
            padding: 0 10px;
            background: #454d5d;
          }
        `}</style>
        <input
          type="radio"
          id={id}
          name="accordion-radio"
          readOnly
          hidden
          checked={idx === frames.size - 1}
        />
        <label className="accordion-header hand">
          {scope.name}
        </label>
        {child}
      </div>
    );
  });
  return (
    <div className="accordion">
      {content}
    </div>
  );
};

class Interpreter extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      editor: null,
      session: null,
      visualizer: null,
      interpreter: null,
      interpreters: [],
      visualizers: [],
      errors: [],
      isRunning: false
    };
  }

  componentDidMount() {
    const { createSession } = require('source-toolchain');
    this.createSession = createSession;
    this.setState({
      session: this.resetSession()
    });
  }

  handleNext = () => {
    const { session, interpreter, interpreters, visualizers } = this.state;
    const index = interpreters.indexOf(interpreter);
    if (index !== interpreters.length - 1) {
      this.setState({
        interpreter: interpreters[index + 1],
        visualizer: visualizers[index + 1]
      });
    } else {
      session.next();
    }
  };

  handlePrevious = () => {
    const { interpreter, interpreters, visualizer, visualizers } = this.state;
    const index = interpreters.indexOf(interpreter);
    this.setState({
      interpreter: interpreters[index - 1] || interpreter,
      visualizer: visualizers[index - 1] || visualizer
    });
  };

  handleStartOver = () => {
    const { session, editor } = this.state;
    if (session) {
      session.start(editor.getValue());
    }
  };

  handleStop = () => {
    this.removeMarkers();
    this.setState({
      interpreter: null,
      visualizer: null,
      interpreters: [],
      visualizers: [],
      session: this.resetSession(),
      isRunning: false
    });
  };

  resetSession() {
    const session = this.createSession(3);

    session.on('start', () => {
      this.setState({
        isRunning: true,
        errors: [],
        interpreter: session.interpreter,
        interpreters: [session.interpreter],
        visualizers: [session.visualizer],
        visualizer: session.visualizer
      });
    });

    session.on('next', () => {
      const { interpreter, visualizer } = session;
      const { interpreters, visualizers } = this.state;

      this.setState({
        isRunning: true,
        interpreter,
        visualizer,
        interpreters: interpreters.concat([interpreter]),
        visualizers: visualizers.concat([visualizer])
      });
    });

    session.on('errors', errors => {
      this.setState({ errors });
    });

    session.on('done', () => {
      this.removeMarkers();
      this.setState({ isRunning: false });
    });

    return session;
  }

  componentDidUpdate(prevProps, prevState) {
    const { editor, isRunning, interpreter, errors } = this.state;

    if (editor) {
      editor.setReadOnly(isRunning);
    }

    if (
      editor &&
      interpreter &&
      prevState.interpreter !== interpreter &&
      interpreter.node
    ) {
      const range = new Range(
        interpreter.node.loc.start.line - 1,
        interpreter.node.loc.start.column,
        interpreter.node.loc.end.line - 1,
        interpreter.node.loc.end.column
      );
      this.removeMarkers();
      editor.getSession().addMarker(range, 'Editor-highlight');
    } else if (errors.length !== 0) {
      this.removeMarkers();
      errors.forEach(e => {
        const range = new Range(
          e.node.loc.start.line - 1,
          e.node.loc.start.column,
          e.node.loc.end.line - 1,
          e.node.loc.end.column
        );
        editor.getSession().addMarker(range, 'Editor-highlight-error');
      });
    }
  }

  removeMarkers() {
    const editor = this.state.editor;
    const editSession = editor.getSession();
    const markers = editSession.getMarkers();
    Object.keys(markers).forEach(m => editSession.removeMarker(m));
  }

  compareLine = (s1, s2) => {
    if (s1.node.loc.start.line < s2.node.loc.start.line) {
      return -1;
    } else if (s1.node.loc.start.line > s2.node.loc.start.line) {
      return 1;
    } else if (s1.node.loc.start.column < s2.node.loc.start.column) {
      return -1;
    } else if (s1.node.loc.start.column > s2.node.loc.start.column) {
      return 1;
    } else {
      return -1;
    }
  };

  render() {
    const {
      session,
      interpreter,
      interpreters,
      visualizer,
      isRunning,
      errors
    } = this.state;
    const index =
      interpreters && interpreter && interpreters.indexOf(interpreter);
    const errorsSection =
      errors &&
      errors.length > 0 &&
      <div className="Section-errors column col-6 col-sm-12">
        <h6>Errors</h6>
        {errors.sort(this.compareLine).map((e, idx) =>
          <div key={idx} className="Section-error columns">
            <div className="Section-error-line col-1">
              {e.node ? e.node.loc.start.line : '<unknown>'}
            </div>
            <div className="Section-error-explanation col-11">
              {e.explanation}
            </div>
          </div>
        )}
      </div>;
    const visualizerSection =
      !errorsSection &&
      isRunning &&
      <div className="Section-visualizer column col-6 col-sm-12">
        <Visualizer visualizer={visualizer} />
        <EnvironmentTable
          scopes={interpreter && interpreter.scopes}
          frames={interpreter && interpreter.frames}
        />
      </div>;

    const editorOnChange = () => {
      this.removeMarkers();
    };

    const editorOnReady = editor => {
      this.setState({ editor });
    };

    const editorInitialValue = `
function arithmetic(n) {
  if (n <= 1) {
    return n;
  } else {
    return n + arithmetic(n - 1); 
  }
}

arithmetic(3); 
`;

    const editor = (
      <Editor
        initialValue={editorInitialValue}
        onChange={editorOnChange}
        onReady={editorOnReady}
      />
    );

    const controls = (
      <InterpreterControl
        isNextDisabled={!session || !isRunning}
        isPreviousDisabled={!session || !isRunning || !index || index <= 0}
        isStartOverDisabled={!session}
        isUntilEndDisabled={!session}
        isStopDisabled={!session || !isRunning}
        handleStop={this.handleStop}
        handleNext={this.handleNext}
        handlePrevious={this.handlePrevious}
        handleStartOver={this.handleStartOver}
      />
    );

    return (
      <div className="columns">
        <div className="column col-6 col-sm-12">
          {controls}
          {editor}
        </div>
        {errorsSection}
        {visualizerSection}
      </div>
    );
  }
}

export default Interpreter;
