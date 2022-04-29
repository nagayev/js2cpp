#if !defined(_GNU_SOURCE)
    #define _GNU_SOURCE
#endif

#include <setjmp.h>
#include <string>
#include <fenv.h>
#include <signal.h>

#define ERROR_CATCHED 1

#ifdef __linux__ 
    #define JS_try try
    #define JS_catch catch
#elif _WIN32
    #include <windows.h> 
    #define JS_try __try
    #define JS_catch __except
#else
    #error "Unknown OS: Coudn't handle JS erros"
#endif

struct JS_error_s {
   jmp_buf ebuf;
   int state; //JS_error.state=setjmp(ebuf);
   std::string error_str; //something like "Integer divide by zero"
};

struct JS_error_s JS_error;

void sigfpe_hdl(int signum, siginfo_t *si, void *ctx) {
  if (signum == SIGFPE) {
    std::string msg;
    switch (si->si_code) { /* see `man 2 sigaction` for the list */
      case FPE_INTDIV: msg = "Integer divide by zero"          ; break;
      case FPE_INTOVF: msg = "Integer overflow"                ; break;
      case FPE_FLTDIV: msg = "Floating-point divide by zero"   ; break;
      case FPE_FLTOVF: msg = "Floating-point overflow"         ; break;
      case FPE_FLTUND: msg = "Floating-point underflow"        ; break;
      case FPE_FLTRES: msg = "Floating-point inexact result"   ; break;
      case FPE_FLTINV: msg = "Floating-point invalid operation"; break;
      case FPE_FLTSUB: msg = "Subscript out of range"          ; break;
      default: msg = "Unknown FPE";
    }
    
    JS_error.error_str=msg;
  }

  longjmp(JS_error.ebuf,ERROR_CATCHED);
}

#ifdef __linux__
void HANDLE_ERRORS(){
    JS_error.state = setjmp(JS_error.ebuf); 
    if (JS_error.state==ERROR_CATCHED){ 
        throw std::runtime_error(JS_error.error_str);
    }
    else {
        struct sigaction sa_fpe;
        sa_fpe.sa_sigaction=sigfpe_hdl;
        sa_fpe.sa_flags=SA_SIGINFO;
        sigaction (SIGFPE, &sa_fpe, 0);
        
        feenableexcept (FE_ALL_EXCEPT); //NOTE: non-standart function
    }
}
#elif _WIN32
void HANDLE_ERRORS(){}
#endif
