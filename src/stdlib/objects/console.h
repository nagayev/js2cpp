#pragma once
#include "../builtins.h"
#include <iostream>

struct Console_ {
    /*Console_(){
        //std::ios_base::sync_with_stdio(false);
    }*/
    public:
    template<typename T>
    void log(T n){
        std::string s = window.__to_string__(n);
        std::cout<<s<<endl;
    }
    template<typename T>
    void warn(T n){
        std::string s = window.__to_string__(n);
        std::cout<<s<<endl;
    }
    template<typename T>
    void error(T n){
        std::string s = window.__to_string__(n);
        std::cerr<<s<<endl;
    }
    void clear(){
        std::cout<<"\e[1;1H\e[2J";
    }
};
Console_ console;
 
 
