export DESTDIR=build/destdir
cmake --install build/fcitx5
cmake --install build/wasmfrontend
cmake --install build/wasmnotifications
cmake --install build/webkeyboard
cmake --install build/webpanel
touch build/dummy.cpp
