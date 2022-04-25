#pragma once
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
    //__to_boolean
    /*JS_boolean __to_boolean__(JS_int i){
        if (i==0) return false;
        return true;
    }
    JS_boolean __to_boolean__(JS_float f){
        return __to_boolean__((int)f);
    }
    JS_boolean __to_boolean__(JS_boolean b){
        return b;
    }
    JS_boolean __to_boolean__(JS_string s){
        if (s=="") return false;
        return true;
    }
    template<typename T>
    JS_boolean __to_boolean__(JS_array<T> arr){
        if (arr.size()==0){
            return false;
        }
        return true;
    }*/
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

template<typename ... Args>
std::string string_format( const std::string& format, Args ... args )
{
    int size = std::snprintf( nullptr, 0, format.c_str(), args ... ) + 1; // Extra space for '\0'
    char* buf =  new char[size];
    std::snprintf(buf, size, format.c_str(), args ... );
    return std::string(buf, buf + size - 1 ); // We don't want the '\0' inside
}

template<typename T>
JS_int eval(T s){
    throw std::runtime_error("You coudn't use eval"); 
    return 1;
}
 
WindowCls window;
