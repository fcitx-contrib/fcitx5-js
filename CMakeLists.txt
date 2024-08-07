cmake_minimum_required(VERSION 3.27)

project(fcitx5-wasm VERSION 0.1.0)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(CMAKE_CXX_STANDARD 17)

set_property(GLOBAL PROPERTY TARGET_SUPPORTS_SHARED_LIBS TRUE)
set(CMAKE_SHARED_LIBRARY_CREATE_C_FLAGS "-sSIDE_MODULE")
set(CMAKE_SHARED_LIBRARY_CREATE_CXX_FLAGS "-sSIDE_MODULE")
add_compile_options(-fPIC)

set(fmt_DIR "build/sysroot/usr/lib/cmake/fmt")
find_package(fmt REQUIRED)
set(ECM_DIR "/usr/share/ECM/cmake")

option(ENABLE_TEST "" OFF)
option(ENABLE_COVERAGE "" OFF)
option(ENABLE_ENCHANT "" OFF)
option(ENABLE_X11 "" OFF)
option(ENABLE_WAYLAND "" OFF)
option(ENABLE_DBUS "" OFF)
option(ENABLE_DOC "" OFF)
option(ENABLE_SERVER "" OFF)
option(ENABLE_KEYBOARD "" OFF)
option(USE_SYSTEMD "" OFF)
option(ENABLE_XDGAUTOSTART "" OFF)
option(ENABLE_EMOJI "" OFF)
option(ENABLE_LIBUUID "" OFF)
option(ENABLE_ASAN "Enable Address Sanitizer" OFF)
option(BUILD_SPELL_DICT "" OFF)

set(CMAKE_INSTALL_LIBDATADIR "${CMAKE_INSTALL_PREFIX}/lib")
add_subdirectory(fcitx5)

add_subdirectory(wasmfrontend)

add_subdirectory(src)
