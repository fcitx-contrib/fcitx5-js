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
SPELL_DICT_DIR=$EXTRACT_DIR/share/fcitx5/spell
mkdir -p $SPELL_DICT_DIR

for dep in "${deps[@]}"; do
  file=$dep.tar.bz2
  [[ -f cache/$file ]] || wget -P cache https://github.com/fcitx-contrib/fcitx5-prebuilder/releases/download/js/$file
  tar xjvf cache/$file -C $EXTRACT_DIR
done

file=Fcitx5-arm64.tar.bz2
[[ -f cache/$file ]] || wget -P cache https://github.com/fcitx-contrib/fcitx5-macos/releases/download/latest/$file
tar xjvf cache/$file -C $SPELL_DICT_DIR --strip-components=5 Fcitx5.app/Contents/share/fcitx5/spell/en_dict.fscd
