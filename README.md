# JediScript Toolchain and Standard Library

JediScript is a subset of JavaScript used as teaching language for
first year undergraduate student in NUS.

This repository is a rewrite of original JediScript runtime system.

## Rationale of Rewriting

1. Modernize the compiler architecture

  Compiler shouldn't be monolithic, it should act as a service to
  support IDE features such as autocompletion.

2. Modularize the code generation and remove dependency of a VM.

  While we are waiting for WebAssembly to be standardized, we will factor
  out the code generation so that we can add support to WebAssembly later

3. TypeScript.

  Large codebase is hard to maintain, so we will use types.

4. Modernize the build system.

  Replace grunt with Webpack, add Travis CI, and separate standard
  library and compiler in two chunks.

5. Standardize.

  Standardize the AST to match ESTree so that we can reuse tools that
  make use of ESTree standard such as Tern.js

6. Time Traveling VM.

  Generalize the VM  to support both mutable and immutable state.
  The immutable VM will be useful to provide rollback operation in
  debugger.

## Architecture

1. `service`. The toplevel API is an asynchronous service to facade the components below.

1. `parser`. We write the grammar of all variants of Jediscript and feed it
  to Jison. This time, no code generation is used;
  instead we generate the parser on the fly using `mustache`.

1. `checker`. Catch obvious type error on the AST for student's sake
  such as dividing number with function

1. `binder`. Traverse the AST and build a symbol table to support syntax analyzer.

1. `emitter`. Emit VM instructions from AST.

1. `runtime`. Run the instructions in a stack based VM asynchronously.

1. `interop`. FFI between JediScript and JavaScript.

## Development

### Dependencies

You will need
  - NodeJS (>= 4.0)
  - NPM (>= 3.0)
  - TypeScript (>= 1.8) and decent TypeScript editor/IDE

### Installation Instructions

1. `npm install`
1. `npm run compile`  - To compile into ES5 bundle.
1. `npm test`         - To run the test suite.
1. `npm run dev`      - To start a development server with hot reload

## Contributors

Evan Sebastian <evanlhoini@gmail.com> - Author

## License
MIT
