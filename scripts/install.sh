export DESTDIR=build/destdir
for dir in chromepanel fcitx5 wasmfrontend wasmnotifications webkeyboard webpanel; do
  cmake --install build/$dir
done
touch build/dummy.cpp
