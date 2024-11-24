deps=(
  ecm
  fmt
  iso-codes
  json
  json-c
  libexpat
  libxkbcommon
  xkeyboard-config
)

EXTRACT_DIR=build/sysroot/usr
mkdir -p $EXTRACT_DIR

for dep in "${deps[@]}"; do
  file=$dep.tar.bz2
  [[ -f cache/$file ]] || wget -P cache https://github.com/fcitx-contrib/fcitx5-prebuilder/releases/download/js/$file
  tar xjvf cache/$file -C $EXTRACT_DIR
done
