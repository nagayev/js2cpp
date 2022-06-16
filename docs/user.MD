# User docs

We support building resulting C++ code using g++ on Linux and MSVC/g++ on Windows.
stdlib for MacOS and FreeBSD isn't tested and isn't finished yet.
Building with clang also should work.
You need compiler support at least C++11.

## Known bugs

If you want to use exceptions on Windows you coudn't use g++, only MSVC.

## Third-party libraries

You should have:

- GMP for working with BigInts
- [fmtlib](https://github.com/fmtlib/fmt) for using template strings (if you compiler doesn't support C++20)

For using gmp with g++ on Linux you should pass -lgmp option like:
`g++ js_result.cpp -o js_bin -lgmp`
For installing `gmp` for Windows see [this page](https://gmplib.org/list-archives/gmp-discuss/2012-July/005089.html)
For installing `fmtlib` you should build it using `make`.
