# The Source Tool chain and Standard Library
[![Build Status](https://travis-ci.org/evansb/source-toolchain.svg?branch=master)](https://travis-ci.org/evansb/source-toolchain)

Source is a subset of JavaScript (ES5) used as teaching language for
first year undergraduate student in NUS (CS1101S).

This repository houses a learner friendly runtime system for Source.
The goal of this runtime system is to have:

1. Very friendly error message with link to lecture topic (see Elm).
2. Modern streaming architecture with end goal of interactivity.
3. Educational tools: e.g Substitution Stepper, List Visualizer.

## Directory Structure

    doc                     Documentation
    lib                     Compiled entry point (Node JS)
    src/toolchain           Toolchain  (Compiler, Debugger, etc)
    src/stdlib              Standard library (e.g lists and stream) in JS
    tests/toolchain         Toolchain unit test
    tests/stdlib            Standard library tests
    tests/conformance       Integration test

## Getting Started (For Developer)

1. You will need

        npm>=3 and node>=5  To develop
        typings-cli         To install type definitions
        vscode              Recommended TypeScript editor

2. Install and compile

        typings install
        npm install
        npm run compile

3. See `package.json` for more build options.

## Credits

This project uses RxJS 5 for its reactive API and and Esprima for parsing JS program.

## Contributors

Evan Sebastian <evanlhoini@gmail.com> - Author

## License
MIT
