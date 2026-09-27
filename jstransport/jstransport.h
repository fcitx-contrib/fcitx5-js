#pragma once

#include <emscripten.h>

#include <string>

namespace fcitx {

inline void sendEventToKeyboard(const std::string &event) {
    EM_ASM(fcitx.sendEventToKeyboard(UTF8ToString($0)), event.c_str());
}

} // namespace fcitx
