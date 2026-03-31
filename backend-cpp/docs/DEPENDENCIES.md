# C++ Backend Dependencies (Drogon)

## Compiler and build tools
- C++20 capable compiler (GCC 11+, Clang 14+, MSVC 19.3+)
- CMake 3.16+
- Ninja or Make

## Drogon framework
- Drogon (required)
- Main header included by this backend:

```cpp
#include <drogon/drogon.h>
```

Install Drogon using your platform package manager or from source: https://github.com/drogonframework/drogon

## Optional runtime dependencies
- PostgreSQL client libraries (`libpq`) if you wire database access
- OpenSSL (usually required by Drogon)
- zlib (usually required by Drogon)
