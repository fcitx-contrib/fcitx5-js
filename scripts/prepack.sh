set -e

rm -rf dist/*
mkdir -p dist
cp -rL preview/{Fcitx5.{data,js,wasm},lib*} dist
cp page/Fcitx5.d.ts dist
