add_definitions(-DFCITX_GETTEXT_DOMAIN=\"fcitx5-wasm\")

add_library(wasmfrontend STATIC wasmfrontend.cpp)
target_link_libraries(wasmfrontend Fcitx5::Core)
target_include_directories(wasmfrontend PUBLIC
    "${CMAKE_SOURCE_DIR}/src"
)

configure_file(wasmfrontend.conf.in.in wasmfrontend.conf.in @ONLY)
fcitx5_translate_desktop_file(${CMAKE_CURRENT_BINARY_DIR}/wasmfrontend.conf.in wasmfrontend.conf)

install(FILES "${CMAKE_CURRENT_BINARY_DIR}/wasmfrontend.conf"
    DESTINATION "${CMAKE_INSTALL_PREFIX}/share/fcitx5/addon"
)
