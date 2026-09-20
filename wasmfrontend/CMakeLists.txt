add_library(wasmfrontend STATIC wasmfrontend.cpp)
target_link_libraries(wasmfrontend Fcitx5::Core)

configure_file(wasmfrontend.conf.in.in wasmfrontend.conf.in @ONLY)
fcitx5_translate_desktop_file(${CMAKE_CURRENT_BINARY_DIR}/wasmfrontend.conf.in wasmfrontend.conf)

install(FILES "${CMAKE_CURRENT_BINARY_DIR}/wasmfrontend.conf"
    DESTINATION "${CMAKE_INSTALL_PREFIX}/share/fcitx5/addon"
)
