import Head from '../components/Head'
import Header from '../components/Header'
import Section from '../components/Section'
import Interpreter from '../components/Interpreter'
import Footer from '../components/Footer'

const interpreterSection = (
  <Section
    title="Single Step Interpreter"
    subtitle="Evaluates Program Step-by-Step According to Substitution Model">
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
  </Section>
)

const weekByWeekSection = (
  <Section
    title="Only Good Parts of JavaScript"
    subtitle="Say no to Hoisting and Non Strict Equality">
    <div>
      <style jsx>{`
        .weeks {
          margin-top: 50px;
        }
      `}</style>
      <p>
        We eliminate JavaScript features such as non-strict equality, hoisting,
        variadic arguments, null values, syntax and semantics that might cause confusion
        for beginners.
      </p>
      <br />
      <h6>Growing Language</h6>
      <p>
        Students start with a small, purely functional subset of JavaScript.
        As the learning progress, more features such
        as list data structure are introduced gradually.
        Eventually, imperative programming constructs such
        as objects and loops are added.
        <br /><br />
        We added a sanitizer phase after parsing to make sure students
        only used allowed language features.
      </p>
      <ul className="weeks step">
        <li className="step-item">
          <a><span className="Section-week">Week 1</span><br/>Functions</a></li>
        <li className="step-item">
          <a><span className="Section-week">Week 5</span><br/>List</a>
        </li>
        <li className="step-item">
          <a><span className="Section-week">Week 6</span><br/>Mutations</a>
        </li>
        <li className="step-item">
          <a><span className="Section-week">Week 8</span><br/>Objects</a>
        </li>
        <li className="step-item">
          <a><span className="Section-week">Week 12</span><br/>Loops</a>
        </li>
      </ul>
    </div>
  </Section>
)

const syntaxAnalyzerSection = (
  <Section
     title="Friendly Syntax Analyzer"
     subtitle="Explain common mistakes with clear error messages">
    <p>
      Error messages should be educating, not fighting back.
      We tried our best to make every errors, syntax or semantic,
      to have a <em>human friendly explanation</em> and <em>suggestion for
      fixing them</em>.
    </p>
  </Section>
)

export default () => (
  <div>
    <style jsx>{`


    `}</style>
    <Head title="source-toolchain" />
    <Header />
    <main>
      {interpreterSection}
      {weekByWeekSection}
      {syntaxAnalyzerSection}
    </main>
    <Footer />
  </div>
)
