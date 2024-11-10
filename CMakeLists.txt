cmake_minimum_required(VERSION 3.27)

project(fcitx5-js VERSION 0.1.0)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(CMAKE_CXX_STANDARD 17)

set_property(GLOBAL PROPERTY TARGET_SUPPORTS_SHARED_LIBS TRUE)
set(CMAKE_SHARED_LIBRARY_CREATE_C_FLAGS "-sSIDE_MODULE")
set(CMAKE_SHARED_LIBRARY_CREATE_CXX_FLAGS "-sSIDE_MODULE")
add_compile_options(-fPIC -fexceptions)

set(PREBUILDER_LIB_DIR "${PROJECT_BINARY_DIR}/sysroot/usr/lib")
set(PREBUILDER_SHARE_DIR "${PROJECT_BINARY_DIR}/sysroot/usr/share")

set(ENV{PKG_CONFIG_PATH} "${PREBUILDER_LIB_DIR}/pkgconfig:${PREBUILDER_SHARE_DIR}/pkgconfig")

set(fmt_DIR "${PREBUILDER_LIB_DIR}/cmake/fmt")
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
option(USE_SYSTEMD "" OFF)
option(ENABLE_XDGAUTOSTART "" OFF)
option(ENABLE_EMOJI "" OFF)
option(ENABLE_LIBUUID "" OFF)
option(BUILD_SPELL_DICT "" OFF)
option(BUILD_PREVIEW "" OFF)

# Override iso-codes paths and xkb default rules file
set(ISOCODES_ISO3166_JSON "${CMAKE_INSTALL_PREFIX}/share/iso-codes/json/iso_3166-1.json")
set(ISOCODES_ISO639_JSON "${CMAKE_INSTALL_PREFIX}/share/iso-codes/json/iso_639-3.json")
set(XKEYBOARDCONFIG_XKBBASE "${CMAKE_INSTALL_PREFIX}/share/X11/xkb")
set(XKEYBOARDCONFIG_DATADIR "${CMAKE_INSTALL_PREFIX}/share")

set(CMAKE_INSTALL_LIBDATADIR "${CMAKE_INSTALL_PREFIX}/lib")
add_subdirectory(fcitx5)

add_subdirectory(wasmfrontend)
add_subdirectory(fcitx5-webview)
add_subdirectory(webpanel)

file(GLOB JS_SOURCES CONFIGURE_DEPENDS "page/*")
add_custom_command(
    OUTPUT ${PROJECT_BINARY_DIR}/pre.js ${PROJECT_BINARY_DIR}/index.js
    COMMAND pnpm run build
    DEPENDS ${JS_SOURCES}
    WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}
    COMMENT "Generating the pre.js and index.js..."
)
add_custom_target(GeneratePostJS ALL
    DEPENDS ${PROJECT_BINARY_DIR}/pre.js ${PROJECT_BINARY_DIR}/index.js
)

add_subdirectory(src)
