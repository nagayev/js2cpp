#pragma once
//#include "../types.h"
#include "../builtins.h"

#include <vector>
#include <stdexcept>

using namespace std;

template<class T> 
class JS_Array{
    private:
    vector<T> data;
    public:
    int length;
    JS_Array(){
        length = 0;
    }
    JS_Array(std::initializer_list<T> init) {
        data = std::vector<T>();
        for (T e: init) {
            data.push_back(e);
        }
        length = data.size();
    }
    JS_Array(std::vector<T> & some_vec) {
        data = some_vec;
        length = some_vec.size();
    }
    JS_Array<T> & operator=(const vector<T>& other)
    {
        data = other;
        length = other.size();
        return *this;
    }
    JS_Array<T> & operator=(const std::initializer_list<T>& other)
    {
        data = std::vector<T>();
        for (T e: other) {
            data.push_back(e);
        }
        length = data.size();
        return *this;
    }
    T operator[] (int index) {
        if (index < 0 || index >= data.size()) {
            throw std::invalid_argument("Invalid index");
        }
        return data[index];
    }
    int push(T value) {
        data.push_back(value);
        length += 1;
        return length;
    }
    T pop() {
        length -= 1;
        T last_value = data[length];
        data.pop_back();
        return last_value;
    }
    int unshift(T value) {
        length += 1;
        data.insert(data.begin(), value);
        return length;
    }
    int indexOf(T needle) {
        for (int i = 0; i < data.size(); i++) {
            if (data[i] == needle) {
                return i;
            }
        }
        return -1;
    }
    bool includes(T needle){
        for(T e:data){
            if (e==needle) return true;
        }
        return false;
    }
    
    JS_string __to_string__(){
        printf("using array.h\n");
        string s = "";
        if (data.size()==0){
            return "";
        }
        for (int i=0;i<data.size(); i++){
            T e = data[i];
            s+=to_string(e); //inner builtin function
            s.push_back(',');
        }
        s.pop_back();
        return s;
    }
    
};
 
