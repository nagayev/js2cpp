# js2cpp

## Intro 

js2cpp is a compiler for converting JavaScript to C++.   
In comparison with some other projects like QuickJS compiler, js2cpp generates no-overhead C++ code that can be compiled.  
**js2cpp is currently an Alpha quality compiler**.  
This means that js2cpp is under heavy development and you have to be ready to encounter some problems.   
Different things may not work well.  
For more information see [STATUS](https://github.com/nagayev/js2cpp/blob/master/STATUS.MD) file.  

## Usage

It's very easy. You need to run `node js2cpp.js your_js_file` and you'll get file `js_result.cpp`.

### In

```js
let a = 'Hello world';
console.log(a);
```

### Out
```cpp
//Auto generated code using js2cpp
#include <iostream>
#include "src/stdlib/builtins.h"
#include "src/stdlib/console.h"
using namespace std;
int main(){
string a = "Hello world";
console.log(a);
return 0;
}

```

### Options

-o --output Output name, default is js_result.cpp  
-s --stdlib Path to stdlib folder, default is stdlib  
--no-type-checks Don't check JavaScript types, default is false  
--no-format Don't format output code, default is false   
--sort-imports Enable sorting of C++ includes, default is false  

It can be compiled using C++ compiler like `g++` (for details see [this](https://github.com/nagayev/js2cpp/blob/master/docs/user.MD) page). 

## Docs

See [docs](https://github.com/nagayev/js2cpp/blob/master/docs/) folder.

## License

MIT. See [LICENSE](https://github.com/nagayev/js2cpp/blob/master/LICENSE) file for details.
