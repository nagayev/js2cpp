#pragma once

//201402L
#if __cplusplus < 201103L
    #error You are using too old toolchain
#endif

//Check OS
//We support Windows, Linux, MacOS and FreeBSD
#ifndef _WIN32
    #if !defined(__linux__) && !defined(__APPLE__) && !defined(__FreeBSD__)
        #error "Unknown OS"
    #endif
#endif

#include <cmath>
#include <string>
#include <stdexcept>
#include "types.h"
#define NaN NAN

//Error, EvalError, InternalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError

using namespace std;

struct WindowCls{
    JS_string __to_string__(JS_int i){
        return std::to_string(i);
    }
    JS_string __to_string__(JS_float f){
        return std::to_string(f);
    }
    JS_string __to_string__(JS_boolean b){
        if (b) return "true";
        return "false";
    }
    JS_string __to_string__(const char* s){
        std::string str(s);
        return str;
    }
    JS_string __to_string__(JS_string s){
        return s;
    }
    template<typename T>
    JS_string __to_string__(JS_array<T> arr){
        string s = "";
        if (arr.length==0){
            return "";
        }
        for (int i=0;i<arr.length; i++){
            T e = arr[i];
            s+=this->__to_string__(e);
            s.push_back(',');
        }
        s.pop_back();
        return s;
    }
    template<typename T>
    JS_boolean __to_boolean__(T something){
        JS_string s = this->__to_string__(something);
        if (s=="" || s=="false") return false;
        return true;
    }
};

JS_int parseInt(JS_string s){
    int r = atoi(s.c_str());
    if (r==0 && s[0]!='0'){
        return NAN; //FIXME:
    }
    return (JS_int)r;
}

JS_float parseFloat(JS_string s){
    JS_float r = atof(s.c_str());
    if (r==0 && s[0]!='0'){
        return NAN;
    }
    return r;
}

JS_boolean isNaN(JS_float x){
    return isnan(x);
}

JS_boolean isFinite(JS_float x){
    return !(isnan(x) || isinf(x));
}

template<typename T>
JS_int eval(T s){
    throw std::runtime_error("You coudn't use eval"); 
    return 1;
}
 
WindowCls window;
