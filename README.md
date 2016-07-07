# The Source Tool chain and Standard Library

Source is a subset of JavaScript used as teaching language for
first year undergraduate student in NUS.

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

### Dependencies

This project uses RxJS 5 and Esprima

## Contributors

Evan Sebastian <evanlhoini@gmail.com> - Author

## License
MIT
