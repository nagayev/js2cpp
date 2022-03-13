# JS2CPP Documentation

## File Structure

The main file is `js2cpp.js`

## Tests

We have two tests - `correct.js` and `incorrect.js`.
We compiled it using Github Actions.

## Depedencies

We use `@babel/parser` for parsing js code and `argparse` for parsing command line arguments.

## Classes

We have only one class - `CPPGenerator`.  
It has a global object - `cpp_generator`.

### Functions

addCode (code)

addRaw (code)

## Functions

### JS_assert (value, message, CustomError = Error)

Works like classic assert, but throws `CustomError` not `AssertationError`

### JS_type_assert (value, message)

Works like JS_assert, but disabled if user pass `no_type_checks` flag

### getExpressionType (node, anotherNode)

Takes node and returns it's C type.
We use it for type checking when variable gets new value.

### getVariableType (node)

Returns type of variable using "compiler's memory" (`cpp_generator.types`).

### parse_node (node)

The main parsing function.
Huge switch with lots of small parsing functions.

### main_parse

Iterates over all nodes and calles `parse_node` for everyone.

### main

Runs `main_parse` and prints status of the compilation.
