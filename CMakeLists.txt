cmake_minimum_required(VERSION 3.27)

project(fcitx5-js VERSION 0.1.0)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(CMAKE_CXX_STANDARD 20)

set_property(GLOBAL PROPERTY TARGET_SUPPORTS_SHARED_LIBS TRUE)
set(CMAKE_SHARED_LIBRARY_CREATE_C_FLAGS "-sSIDE_MODULE")
set(CMAKE_SHARED_LIBRARY_CREATE_CXX_FLAGS "-sSIDE_MODULE")
# -fexperimental-library is for std::osyncstream
add_compile_options(-fPIC -fexceptions -fexperimental-library)

option(RIME_ONLY "Disable components unused by rime" OFF)
option(ENABLE_ASAN "Enable Address Sanitizer" OFF)

if (RIME_ONLY)
    option(ENABLE_KEYBOARD "" OFF)
endif()

if (ENABLE_ASAN)
    # Very slow. Not recommended to use with chinese-addons.
    add_compile_options(-fsanitize=address)
    add_link_options(-fsanitize=address)
endif()

if (CMAKE_BUILD_TYPE STREQUAL "Debug")
    add_link_options(-gsource-map)
endif()

set(CMAKE_INSTALL_PREFIX /usr)

set(FIND_ROOT_PATH "${PROJECT_BINARY_DIR}/sysroot/usr")
set(PREBUILDER_LIB_DIR "${FIND_ROOT_PATH}/lib")
set(PREBUILDER_SHARE_DIR "${FIND_ROOT_PATH}/share")

list(APPEND CMAKE_FIND_ROOT_PATH "${FIND_ROOT_PATH}")

set(ENV{PKG_CONFIG_SYSROOT_DIR} "${PROJECT_BINARY_DIR}/sysroot")
set(ENV{PKG_CONFIG_PATH} "${PREBUILDER_LIB_DIR}/pkgconfig:${PREBUILDER_SHARE_DIR}/pkgconfig")

find_package(nlohmann_json)

option(ENABLE_TESTING_ADDONS "" OFF)
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
set(XKEYBOARDCONFIG_XKBBASE "${CMAKE_INSTALL_PREFIX}/share/xkeyboard-config-2")
set(XKEYBOARDCONFIG_DATADIR "${CMAKE_INSTALL_PREFIX}/share")

set(CMAKE_INSTALL_LIBDATADIR "${CMAKE_INSTALL_PREFIX}/lib")
set(EVENT_LOOP_BACKEND "none" CACHE STRING "")
add_subdirectory(fcitx5)

# Disable multiple so and symlink.
set_target_properties(Fcitx5Config Fcitx5Utils Fcitx5Core
    PROPERTIES NO_SONAME TRUE
)

add_subdirectory(wasmfrontend)
add_subdirectory(wasmnotifications)
add_subdirectory(webkeyboard)
add_subdirectory(fcitx5-webview)
add_subdirectory(webpanel)

# Force cmake to re-link Fcitx5.js when non-cpp files are changed.
set(DUMMY_CPP "${PROJECT_BINARY_DIR}/dummy.cpp")

file(GLOB JS_SOURCES CONFIGURE_DEPENDS "page/*")
add_custom_command(
    OUTPUT ${DUMMY_CPP}
    COMMAND pnpm run build && ./scripts/install.sh
    DEPENDS ${JS_SOURCES} clipboard imselector spell quickphrase unicode webpanel webkeyboard wasmfrontend notifications
    WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}
    COMMENT "Generating the pre.js, index.js and installing shared libraries"
)
add_custom_target(NonCppDependencies ALL DEPENDS ${DUMMY_CPP})

add_subdirectory(src)
