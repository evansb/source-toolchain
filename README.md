<p align="center">
  <a href="https://evansb.github.io/source-toolchain/">
    <img alt="source-toolchain" src="https://evansb.github.io/source-toolchain/logo.png" width="144">
  </a>
</p>

<h3 align="center">
  Source Toolchain
</h3>

<p align="center">
  <a href="https://travis-ci.org/evansb/source-toolchain"><img src="https://travis-ci.org/evansb/source-toolchain.svg?branch=master"></a>
  <a href="https://coveralls.io/github/evansb/source-toolchain"><img src="https://coveralls.io/repos/github/evansb/source-toolchain/badge.svg"></a>
</p>

<hr />

[Test Playground](https://evansb.github.io/source-toolchain)

Source is a subset of JavaScript (EcmaScript 5) used to teach freshman introduction to programming course
[CS1101S](http://www.comp.nus.edu.sg/~cs1101s/). 

This repository contains a toolchain (parser, analyzer, interpreter) for Source language and a playground website for the toolchain.

The toolchain has three main components.

  - **Parser**

    The language grammar evolves as the course progress.
    New language constructs are added to reflect the material taught in the course.

    To implement this, we first parse the source using existing ES5 parser (acorn)
    and traverse the AST to filter out any features that students aren't supposed
    to be using yet.

  - **Static Analysis**

    Provide syntax analysis to catch common mistakes: invalid types, missing return
    statement, etc.
    The static analyis comprises of generating Control Flow Graph and applying type
    analysis and data flow analysis.

  - **Interpreter**

    An small-step interpreter for the language that evaluates the program step-by-step.
    There is also an expression visualizer that tracks evaluation progress of an expression
    according to substitution model. Interop with native javascript is also supported
    via FFI (foreign function interface).

## Installation

You will need Node >=6 and NPM >=3.
Yarn is recommended.

```
npm install source-toolchain --save

# Or if you have Yarn
yarn add source-toolchain --save
```

## Developing

Install dependencies (do for current directory and playground)
```
npm install 
# Or if you have Yarn
yarn 
```

Run the task that you need

```
# Toolchain: Run Jest in watch mode 
# Playground: Run Next.js development
npm run dev

# Toolchain: Compile to ES6 then ES5
npm run compile
```

To deploy the playground using `now.sh`

```
# Make sure you compile the toolchain
npm run compile

# Deploy it
cd playground && npm run deploy
```

## License
MIT
