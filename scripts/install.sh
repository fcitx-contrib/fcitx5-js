export DESTDIR=build/destdir
cmake --install build/fcitx5
cmake --install build/wasmfrontend
cmake --install build/webpanel
touch build/dummy.cpp
