#pragma once
#include "../error_names.h"
#include "../types.h"
#include <cmath>
#include <gmp.h>

class BigInt{
JS_private:
    mpz_t __value__; 
public:
    BigInt(){
        mpz_init(__value__);
    }
    BigInt(JS_string s){
        mpz_init(__value__);
        int result = mpz_set_str(__value__,s.c_str(),10);
        if (result < 0 ){
            throw SyntaxError("invalid BigInt syntax");
        }
    }
    BigInt(JS_int i){
        mpz_init(__value__);
        mpz_set_si(__value__,i);
    }
    JS_string __to_string__(){
        //FIXME: small memory leak, see https://stackoverflow.com/a/15691617
        return std::string(mpz_get_str(NULL,10,__value__))+"n";
    }
    BigInt operator + (BigInt c){
        BigInt new_value;
        mpz_add(new_value.__value__,__value__,c.__value__); //new_value.value=value+c.value
        return new_value;
    }
    BigInt operator - (BigInt c){
        BigInt new_value;
        mpz_sub(new_value.__value__,__value__,c.__value__); 
        return new_value;
    }
    
    BigInt operator * (BigInt c){
        BigInt new_value;
        mpz_mul(new_value.__value__,__value__,c.__value__); 
        return new_value;
    }
    
    BigInt operator / (BigInt c){
        BigInt new_value;
        mpz_div(new_value.__value__,__value__,c.__value__);
        return new_value;
    }
    
    int compare(BigInt a, BigInt b){
        return mpz_cmp(a.__value__,b.__value__);
    }
    
    #if __cplusplus >= 202002L
        int operator <=> (BigInt c){
            return compare(*this,c);
        }
    #endif
    
    bool operator < (BigInt c){
        return compare(*this,c)<0;
    }
    
    bool operator <= (BigInt c){
        return compare(*this,c)<=0;
    }
    
    bool operator > (BigInt c){
        return compare(*this,c)>0;
    }
    
    bool operator >= (BigInt c){
        return compare(*this,c)>=0;
    }
    
    bool operator == (BigInt c){
        return compare(*this,c)==0;
    }
    
    BigInt operator & (BigInt c){
        BigInt new_value;
        mpz_and(new_value.__value__,__value__,c.__value__);
        return new_value;
    }
    
    BigInt operator | (BigInt c){
        BigInt new_value;
        mpz_ior(new_value.__value__,__value__,c.__value__);
        return new_value;
    }
    
    BigInt operator ^ (BigInt c){
        BigInt new_value;
        mpz_xor(new_value.__value__,__value__,c.__value__);
        return new_value;
    }
    
    ~BigInt(){
        //NOTE: we shouldn't call mpz_clear(value)
    }
};
