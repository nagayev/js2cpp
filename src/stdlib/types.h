#pragma once
//JavaScript types

#include <string>
#include <map>
#include "array.h"

//Primitives

typedef void JS_void;
typedef int64_t JS_int;
typedef float JS_float;
typedef bool JS_boolean;
typedef std::string JS_string;

//Complex types

#define JS_array JS_Array
//TODO:
#define JS_object std::map
