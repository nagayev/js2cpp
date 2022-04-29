# JS2CPP Documentation

## File Structure

We have two different types of source files: Javascript sources and C++

Javascript files
| File             | Purpose                       |
|------------------|-------------------------------|
| js2cpp.js        | The main file                 |
| args.js          | Command-line argument parser  |
| utils.js         | Utils like JS_assert          |
| cpp_generator.js | Provides cpp_generator object |

C++ files located at src/stdlib
Javascript files
| File             | Purpose                               |
|------------------|---------------------------------------|
| array.h          | Realisation of the Javascript Array   |
| builtins.h       | builtins functions like parseInt      |
| console.h        | Console object                        |
| math.h           | Math object                           |
| types.h          | Javascript type aliases (like JS_bool)|

## Tests

We have two types of tests - `correct` tests and `incorrect`.  
Incorrect tests means we test compiler on wrong code samples.  
We compiled them using Github Actions.

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
