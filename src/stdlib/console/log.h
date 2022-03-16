#include <iostream>
#include <vector>
#include <map>

template <typename T>
std::ostream& operator<< (std::ostream& out, const std::vector<T>& v) {
    if ( !v.empty() ) {
        out << '[';
        for(T a:v){
            out<<a<<',';
        }
        out << ']'; // use ANSI backspace character '\b' to overwrite final ','
    }
    return out;
}

template <typename T, typename T1>
std::ostream& operator<< (std::ostream& out, const std::map<T,T1>& v) {
    if ( !v.empty() ) {
        out << '{';
        for(auto const& a:v){
            out<<a.first<<':'<<a.second<<',';
        }
        out << "\b}"; // use ANSI backspace character '\b' to overwrite final ','
    }
    return out;
}

#define JS_console_log(n) cout<<n<<endl
