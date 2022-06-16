#include "../builtins.h"
#include <iostream>

struct Console_ {
    public:
    template<typename T>
    void log(T n){
        std::string s = window.__to_string__(n);
        std::cout<<s<<endl;
    }
    void clear(){
        std::cout<<"\e[1;1H\e[2J";
    }
};
Console_ console;
 
 
