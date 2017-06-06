Source Toolchain
-------------------

[Website + Demo](https://evansb.github.io/source-toolchain)

Source is a subset of JavaScript (EcmaScript 5) optimised for education.
This repository is a toolchain (parser, analyzer, interpreter) for Source
and has three main features.

  - **Multiple Parser Versions**

    The language grammar changes week by week, new language feature are being added as
    the course progress.
    To implement this, we first parse the source using existing ES5 parser (acorn)
    and traverse the AST to filter out any features that students aren't supposed
    to be using yet.

  - **Learner-friendly Syntax Analysis**

    Provide syntax analysis for common mistakes: invalid types, missing return
    statement, etc

  - **Time Travelling Single Step Interpreter**

    An interpreter of the language that evaluates the program step-by-step
    as defined in the substitution model.

## Installation

You will need Node >=6 and NPM >=3. Yarn is recommended.

```
npm install source-toolchain --save
# Or if you have Yarn
yarn add source-toolchain --save
```

## Developing

Install dependencies.
```
npm install 
# Or if you have Yarn
yarn 
```

Run the task that you need.

```
npm run lint             # Lint the code using tslint
npm run compile          # Compiles to ES6 then ES5
npm run test             # Run the test + coverage
npm run test-watch       # Run the test in watch mode
```

## License
MIT
