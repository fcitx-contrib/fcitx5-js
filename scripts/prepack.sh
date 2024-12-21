set -e

rm -rf dist/*
mkdir -p dist

cp -rL preview/{Fcitx5.{data,js,wasm},lib*} dist

if [[ -e "$(readlink -f preview/Fcitx5.wasm.map)" ]]; then
  cp -L preview/Fcitx5.wasm.map dist
fi

cp page/Fcitx5.d.ts dist
