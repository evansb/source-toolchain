import Interpreter from './Interpreter'

export default () => (
  <div>
    <p>
      While most interpreters and debuggers step the code
      statement-by-statement, Source interpreter breaks
      it down to the expression level. Time travelling
      is possible by making Source interpreter
      state immutable.
    </p>
    <div className="columns">
      <div className="col-6 col-sm-12">
        <ul>
          <li>Single Step Interpreter with Time Travelling.</li>
          <li>Trace Expression Evaluation.</li>
          <li>Understand Recursion Using Environment Visualizer.</li>
        </ul>
      </div>
      <div className="col-6 col-sm-12">
        <ul>
          <li>Runs in Browser and NodeJS.</li>
          <li>Sandboxed Interpreter with Native JavaScript Interop.</li>
        </ul>
      </div>
    </div>
    <Interpreter />
  </div>
)
