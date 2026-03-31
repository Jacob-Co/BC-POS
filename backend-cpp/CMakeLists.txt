cmake_minimum_required(VERSION 3.16)
project(bc_pos_backend_cpp LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(Drogon CONFIG REQUIRED)

add_executable(bc_pos_backend_cpp
  src/main.cc
  src/controllers/UserController.cc
  src/controllers/ItemController.cc
  src/controllers/ReceiptController.cc
)

target_include_directories(bc_pos_backend_cpp PRIVATE src)
target_link_libraries(bc_pos_backend_cpp PRIVATE Drogon::Drogon)
