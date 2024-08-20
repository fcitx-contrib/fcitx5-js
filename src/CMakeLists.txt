add_executable(Fcitx5
    fcitx.cpp
    keycode.cpp
    input_method.cpp
)

target_include_directories(Fcitx5 PRIVATE
    "${PROJECT_SOURCE_DIR}/fcitx5/src/im/keyboard"
    "${PROJECT_SOURCE_DIR}/fcitx5/src/modules/quickphrase"
    "${CMAKE_CURRENT_BINARY_DIR}/../fcitx5"
)

target_link_libraries(Fcitx5
    "-sMAIN_MODULE=1"
    "-fexceptions"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sMAXIMUM_MEMORY=4GB"
    "-sEXPORTED_RUNTIME_METHODS=['ccall','FS']"
    "--preload-file ${PROJECT_BINARY_DIR}/sysroot/usr/share/fcitx5@/usr/share/fcitx5"
    "--preload-file ${PROJECT_BINARY_DIR}/sysroot/usr/share/X11@/usr/share/X11"
    "--preload-file ${PROJECT_BINARY_DIR}/sysroot${ISOCODES_ISO3166_JSON}@${ISOCODES_ISO3166_JSON}"
    "--preload-file ${PROJECT_BINARY_DIR}/sysroot${ISOCODES_ISO639_JSON}@${ISOCODES_ISO639_JSON}"
    "--preload-file ${PROJECT_BINARY_DIR}/sysroot/usr/lib/fcitx5@/usr/lib/fcitx5"
    "-Lfcitx5/src/lib/fcitx-utils"
    "-Lfcitx5/src/lib/fcitx-config"
    Fcitx5::Core
    keyboard
    webpanel
    wasmfrontend
)
