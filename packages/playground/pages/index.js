import Head from '../components/Head'
import Header from '../components/Header'
import Section from '../components/Section'
import Interpreter from '../components/Interpreter'

const interpreterSection = (
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

export default () => (
  <div>
    <style jsx>{`


    `}</style>
    <Head title="source-toolchain" />
    <Header />
    <main>
      <Section
        title="Single Step Interpreter"
        subtitle="Evaluates Program Step-by-Step According to Substitution Model">
        {interpreterSection}
      </Section>
    </main>
  </div>
)
