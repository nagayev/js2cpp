#pragma once
//JavaScript types

#include <string>
#include <map>

#define JS_builtin_func
//Class scopes

#define JS_public public
#define JS_private public

//Primitives

typedef void JS_void;
typedef int64_t JS_int;
typedef float JS_float;
typedef bool JS_boolean;
typedef std::string JS_string;

#define JS_BigInt BigInt
#define JS_Error Error&

//Complex types

#define JS_array JS_Array
//TODO:
#define JS_object std::map
