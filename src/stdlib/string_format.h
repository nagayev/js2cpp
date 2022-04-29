#if defined(__cpp_lib_format)
    #include <format>
#else
    #define FMT_HEADER_ONLY
    #include <fmt/core.h>
    namespace std
    {
        template<typename... Args> \
        inline auto format(Args&&... args) -> decltype(fmt::v8::format(std::forward<Args>(args)...)) \
        { \
            return fmt::v8::format(std::forward<Args>(args)...); \
        }
    }
#endif
