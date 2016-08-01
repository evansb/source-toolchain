# The Source Tool chain and Standard Library
[![Build Status](https://travis-ci.org/evansb/source-toolchain.svg?branch=master)](https://travis-ci.org/evansb/source-toolchain)

Source is a subset of JavaScript (ES5) used as teaching language for
first year undergraduate student in NUS (CS1101S).

This repository houses a learner friendly toolchain for Source written in TypeScript.
The end goal of this runtime system is to have:

1. Very friendly error message with link to lecture topic (see Elm).
2. Modern streaming architecture with end goal of interactivity.
3. Educational tools: e.g Substitution Stepper, List Visualizer.

## Directory Structure

    doc                     Documentation
    src/toolchain           Toolchain (Compiler, Debugger, etc)
    src/stdlib              Javascript standard library (e.g lists and stream)
    es6/**                  Compiled ES6 files and typings.
    es5/**                  Compiled ES5 files

## Getting Started (For Developer)

1. You will need

        npm>=3 and node>=5  To develop
        A good TypeScript editor (Sublime or VSCode recommended)

2. Install and compile

        typings install
        npm install
        npm run compile

3. See `package.json` for more build tasks.

## Credits

This project uses RxJS 5 for its streaming API, acorn for parsing JS, and jshint for linting.

## Contributors

Evan Sebastian <evanlhoini@gmail.com> - Author

## License
MIT
