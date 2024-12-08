add_executable(Fcitx5
    fcitx.cpp
    keycode.cpp
    input_method.cpp
    config.cpp
    action.cpp
    event_js.cpp
    ${DUMMY_CPP}
)

target_include_directories(Fcitx5 PRIVATE
    "${PROJECT_BINARY_DIR}/fcitx5"
)

target_link_libraries(Fcitx5
    "-sMAIN_MODULE=1"
    "-fexceptions"
    "-sSTACK_SIZE=1MB" # fcitx5-chewing's log overflows the default 64KB stack
    "-sALLOW_MEMORY_GROWTH=1"
    "-sMAXIMUM_MEMORY=4GB"
    "-sEXPORTED_RUNTIME_METHODS=['ccall','FS']"
    "-sENVIRONMENT=web" # disable require("ws") in Fcitx5.js which is rejected by project user's bundler
    "--extern-pre-js ${PROJECT_BINARY_DIR}/pre.js"
    "--extern-post-js ${PROJECT_BINARY_DIR}/index.js"
    "--preload-file ${PREBUILDER_SHARE_DIR}/fcitx5@/usr/share/fcitx5"
    "--preload-file ${PREBUILDER_SHARE_DIR}/X11@/usr/share/X11"
    "--preload-file ${PROJECT_BINARY_DIR}/sysroot${ISOCODES_ISO3166_JSON}@${ISOCODES_ISO3166_JSON}"
    "--preload-file ${PROJECT_BINARY_DIR}/sysroot${ISOCODES_ISO639_JSON}@${ISOCODES_ISO639_JSON}"
    "--preload-file ${PREBUILDER_LIB_DIR}/fcitx5@/usr/lib/fcitx5"
    "-Lfcitx5/src/lib/fcitx-utils"
    "-Lfcitx5/src/lib/fcitx-config"
    Fcitx5::Core
)

fcitx5_import_addons(Fcitx5
    REGISTRY_VARNAME getStaticAddon
    ADDONS keyboard webpanel wasmfrontend
)

add_dependencies(Fcitx5 NonCppDependencies)
