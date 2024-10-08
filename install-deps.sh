deps=(
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
  [[ -f cache/$file ]] || wget -P cache https://github.com/fcitx-contrib/fcitx5-js-prebuilder/releases/download/latest/$file
  tar xjvf cache/$file -C $EXTRACT_DIR
done

sed -i "s|-I/usr/include|-I$(pwd)/$EXTRACT_DIR/include|" $EXTRACT_DIR/share/pkgconfig/nlohmann_json.pc
sed -i "s|=/usr/include|=$(pwd)/$EXTRACT_DIR/include|" $EXTRACT_DIR/lib/pkgconfig/json-c.pc
