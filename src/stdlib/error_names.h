#pragma once
#include <string>
#include <stdexcept>
#include <cstring>

struct Error : public std::exception
{
    std::string message;
    const char* name;
    Error(char* n, std::string m){
        message = m;
        name = n;
    }

	const char* what () const throw ()
    {
        char* m = (char*)malloc(strlen(name)+message.size()+12);
        strcpy(m,"Uncaught "); //length is 9
        strcat(m,name);
        strcat(m,": "); //length is 2
        strcat(m,message.c_str());
        return m;
    }
};

struct EvalError: public Error
{
    EvalError(std::string m1):Error("EvalError",m1){
        
    }
};

struct SyntaxError: public Error
{
    SyntaxError(std::string m1):Error("SyntaxError",m1){
        
    }
};

struct RangeError: public Error
{
    RangeError(std::string m1):Error("RangeError",m1){
        
    }
};