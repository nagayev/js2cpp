#if __cplusplus < 201103L && !defined(SKIP_TEST)
    #error "You are using too old toolchain or don't pass -std=c++11"
#endif

#if defined(__GNUC__) || defined(__clang__)
    #define _deprecated __attribute__((deprecated))
#elif defined(_MSC_VER)
    #define _deprecated __declspec(deprecated)
#else
    #pragma message("WARNING: You need to implement _deprecated for this compiler",__FILE__)
    #define _deprecated
#endif

#if __cplusplus < 201402L
    //NOTE: we coudn't transform this to macro suppress
    #if defined(__GNUC__)
        #pragma GCC diagnostic push
        #pragma GCC diagnostic ignored "-Wliteral-suffix"
    #elif defined(_MSC_VER)
        #pragma warning( disable : 4455 ) //TODO: check error code
    #endif
    std::string operator "" s(const char s[], long unsigned int a){
        return std::string(s);
    }
    #if defined(__GNUC__)
        #pragma GCC diagnostic pop
    #endif
#endif

//Check OS
//We support Windows, Linux; MacOS and FreeBSD are coming
#if !defined(SKIP_TEST) && (!defined(_WIN32) && !defined(__linux__))
    #if defined(__APPLE__) || defined(__FreeBSD__)
        #error "MacOS and FreeBSD isn't supported yet"
    #else
        #error "Unsupported OS"
    #endif
#endif 
