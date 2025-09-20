add_library(chromepanel STATIC chromepanel.cpp)
target_link_libraries(chromepanel Fcitx5::Core nlohmann_json::nlohmann_json)

configure_file(chromepanel.conf.in.in chromepanel.conf.in @ONLY)
fcitx5_translate_desktop_file(${CMAKE_CURRENT_BINARY_DIR}/chromepanel.conf.in chromepanel.conf)
install(FILES "${CMAKE_CURRENT_BINARY_DIR}/chromepanel.conf"
    DESTINATION "${CMAKE_INSTALL_PREFIX}/share/fcitx5/addon"
)
