//JS_object
#pragma once
#include <map>
#include "types.h"
#include "base_object.h"

template<class T> 
class JS_Object:public BaseObject {
private:
    std::map<string,T> m;
public:
    //FIXME:
    void set(string key, T value){
        m[key] = value;
    }
    bool hasOwnProperty(JS_string s){
        return m.find(s)!=m.end();
    }
    T operator[](string key){
        return m[key];
    }
};
