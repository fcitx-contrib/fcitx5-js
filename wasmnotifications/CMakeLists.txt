add_library(notifications STATIC notifications.cpp)
target_link_libraries(notifications Fcitx5::Core Fcitx5::Module::Notifications)

configure_file(notifications.conf.in.in notifications.conf.in @ONLY)
fcitx5_translate_desktop_file(${CMAKE_CURRENT_BINARY_DIR}/notifications.conf.in notifications.conf)

install(FILES "${CMAKE_CURRENT_BINARY_DIR}/notifications.conf"
    DESTINATION "${CMAKE_INSTALL_PREFIX}/share/fcitx5/addon"
)
