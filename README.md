# js2cpp

## Intro 

js2cpp is a compiler for converting JavaScript to C++!  
In comparison with some other projects like QuickJS compiler, js2cpp generates no-overhead C++ code that can be compiled then.  

### In

```js
let a = 'Hello world';
console.log(a);
```

### Out
```cpp
//Auto generated code using js-compiler
#include <iostream>
#include "console/log.h"
using namespace std;
int main(){
string a = "Hello world";
JS_console_log(a);
return 0;
}

```

## Usage

It's very easy. You need to run `node js2cpp.js your_js_file` and you'll get file `js_result.cpp`.  
It can be compiled using C++ compiler like `g++` (for details see page Compiling in our Wiki).  

## License

MIT. See License file for details.
