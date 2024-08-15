#ifndef FCITX5_JS_KEYCODE_H
#define FCITX5_JS_KEYCODE_H

#include <fcitx-utils/key.h>

namespace fcitx {
Key js_key_to_fcitx_key(const std::string &key, const std::string &code,
                        uint32_t modifiers);
}
#endif
