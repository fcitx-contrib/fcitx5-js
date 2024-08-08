add_executable(Fcitx5 fcitx.cpp)

target_link_libraries(Fcitx5
    "-sMAIN_MODULE=1"
    "-fexceptions"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sMAXIMUM_MEMORY=4GB"
    "-sEXPORTED_RUNTIME_METHODS=['ccall','FS']"
    "--preload-file ${PROJECT_BINARY_DIR}/sysroot/usr/share/fcitx5@/usr/share/fcitx5"
    "--preload-file ${PROJECT_BINARY_DIR}/sysroot/usr/lib/fcitx5@/usr/lib/fcitx5"
    "-Lfcitx5/src/lib/fcitx-utils"
    "-Lfcitx5/src/lib/fcitx-config"
    Fcitx5::Core
    webpanel
    wasmfrontend
)
