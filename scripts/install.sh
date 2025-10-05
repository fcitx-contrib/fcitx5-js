set -e

export DESTDIR=build/destdir
for dir in fcitx5/src/im fcitx5/src/lib fcitx5/src/modules fcitx5/po chromepanel wasmfrontend wasmnotifications webkeyboard webpanel; do
  cmake --install build/$dir
done
touch build/dummy.cpp
