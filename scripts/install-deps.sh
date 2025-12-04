deps=(
  ecm
  iso-codes
  json
  libexpat
  libxkbcommon
  xkeyboard-config
)

EXTRACT_DIR=build/sysroot/usr
SPELL_DICT_DIR=build/destdir/usr/share/fcitx5/spell
mkdir -p $EXTRACT_DIR $SPELL_DICT_DIR

for dep in "${deps[@]}"; do
  file=$dep.tar.bz2
  [[ -f cache/$file ]] || wget -P cache https://github.com/fcitx-contrib/fcitx5-prebuilder/releases/download/js/$file
  tar xf cache/$file -C $EXTRACT_DIR
done

file=Fcitx5-arm64.tar.bz2
[[ -f cache/$file ]] || wget -P cache https://github.com/fcitx-contrib/fcitx5-macos/releases/download/latest/$file
tar xf cache/$file -C $SPELL_DICT_DIR --strip-components=5 Fcitx5.app/Contents/share/fcitx5/spell/en_dict.fscd
