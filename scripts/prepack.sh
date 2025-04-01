set -e

rm -rf dist/*
mkdir -p dist

cp -rL preview/lib* dist

for ext in data js wasm wasm.map; do
  if [[ -e "$(readlink -f preview/Fcitx5.$ext)" ]]; then
    cp -L preview/Fcitx5.$ext dist
  fi
done

cp page/Fcitx5.d.ts dist
cp build/worker.js dist
