#include "keycode.h"
#include <emscripten.h>
#include <fcitx-utils/log.h>

#include "../deps/input-event-codes.h"

namespace fcitx {
static struct {
    std::string jsCode;
    KeySym sym;
} sym_mappings[] = {
    // modifiers
    {"ControlLeft", FcitxKey_Control_L},
    {"ControlRight", FcitxKey_Control_R},
    {"ShiftLeft", FcitxKey_Shift_L},
    {"ShiftRight", FcitxKey_Shift_R},
    {"CapsLock", FcitxKey_Caps_Lock},
    {"AltLeft", FcitxKey_Alt_L},
    {"AltRight", FcitxKey_Alt_R},
    {"MetaLeft", FcitxKey_Super_L},
    {"MetaRight", FcitxKey_Super_R},

    // keypad
    {"Numpad0", FcitxKey_KP_0},
    {"Numpad1", FcitxKey_KP_1},
    {"Numpad2", FcitxKey_KP_2},
    {"Numpad3", FcitxKey_KP_3},
    {"Numpad4", FcitxKey_KP_4},
    {"Numpad5", FcitxKey_KP_5},
    {"Numpad6", FcitxKey_KP_6},
    {"Numpad7", FcitxKey_KP_7},
    {"Numpad8", FcitxKey_KP_8},
    {"Numpad9", FcitxKey_KP_9},
    {"NumpadComma", FcitxKey_KP_Separator},
    {"NumpadDecimal", FcitxKey_KP_Decimal},
    {"NumpadEqual", FcitxKey_KP_Equal},
    {"NumpadSubtract", FcitxKey_KP_Subtract},
    {"NumpadMultiply", FcitxKey_KP_Multiply},
    {"NumpadAdd", FcitxKey_KP_Add},
    {"NumpadDivide", FcitxKey_KP_Divide},

    // special
    {"Backspace", FcitxKey_BackSpace},
    {"NumpadEnter", FcitxKey_KP_Enter},
    {"Enter", FcitxKey_Return},
    {"Space", FcitxKey_space},
    {"Tab", FcitxKey_Tab},
    {"Escape", FcitxKey_Escape},
    {"Delete", FcitxKey_Delete},
    {"Insert", FcitxKey_Insert},
    {"PageUp", FcitxKey_Page_Up},
    {"PageDown", FcitxKey_Page_Down},
    {"Home", FcitxKey_Home},
    {"End", FcitxKey_End},
    {"PrintScreen", FcitxKey_Print},
    {"ScrollLock", FcitxKey_Scroll_Lock},

    // arrow keys
    {"ArrowUp", FcitxKey_Up},
    {"ArrowDown", FcitxKey_Down},
    {"ArrowLeft", FcitxKey_Left},
    {"ArrowRight", FcitxKey_Right},

    // function keys
    {"F1", FcitxKey_F1},
    {"F2", FcitxKey_F2},
    {"F3", FcitxKey_F3},
    {"F4", FcitxKey_F4},
    {"F5", FcitxKey_F5},
    {"F6", FcitxKey_F6},
    {"F7", FcitxKey_F7},
    {"F8", FcitxKey_F8},
    {"F9", FcitxKey_F9},
    {"F10", FcitxKey_F10},
    {"F11", FcitxKey_F11},
    {"F12", FcitxKey_F12},

    // media keys
    {"AudioVolumeMute", FcitxKey_AudioMute},
    {"AudioVolumeDown", FcitxKey_AudioLowerVolume},
    {"AudioVolumeUp", FcitxKey_AudioRaiseVolume},
    {"MediaStop", FcitxKey_AudioStop},
    {"MediaTrackPrevious", FcitxKey_AudioPrev},
    {"MediaPlayPause", FcitxKey_AudioPlay},
    {"MediaTrackNext", FcitxKey_AudioNext},
};

static struct {
    std::string jsKeycode;
    uint16_t linuxKeycode;
} code_mappings[] = {
    // alphabet
    {"KeyA", KEY_A},
    {"KeyB", KEY_B},
    {"KeyC", KEY_C},
    {"KeyD", KEY_D},
    {"KeyE", KEY_E},
    {"KeyF", KEY_F},
    {"KeyG", KEY_G},
    {"KeyH", KEY_H},
    {"KeyI", KEY_I},
    {"KeyJ", KEY_J},
    {"KeyK", KEY_K},
    {"KeyL", KEY_L},
    {"KeyM", KEY_M},
    {"KeyN", KEY_N},
    {"KeyO", KEY_O},
    {"KeyP", KEY_P},
    {"KeyQ", KEY_Q},
    {"KeyR", KEY_R},
    {"KeyS", KEY_S},
    {"KeyT", KEY_T},
    {"KeyU", KEY_U},
    {"KeyV", KEY_V},
    {"KeyW", KEY_W},
    {"KeyX", KEY_X},
    {"KeyY", KEY_Y},
    {"KeyZ", KEY_Z},

    // number
    {"Digit0", KEY_0},
    {"Digit1", KEY_1},
    {"Digit2", KEY_2},
    {"Digit3", KEY_3},
    {"Digit4", KEY_4},
    {"Digit5", KEY_5},
    {"Digit6", KEY_6},
    {"Digit7", KEY_7},
    {"Digit8", KEY_8},
    {"Digit9", KEY_9},

    // symbol
    {"Backquote", KEY_GRAVE},
    {"Backslash", KEY_BACKSLASH},
    {"BracketLeft", KEY_LEFTBRACE},
    {"BracketRight", KEY_RIGHTBRACE},
    {"Comma", KEY_COMMA},
    {"Period", KEY_DOT},
    {"Equal", KEY_EQUAL},
    {"Minus", KEY_MINUS},
    {"Quote", KEY_APOSTROPHE},
    {"Semicolon", KEY_SEMICOLON},
    {"Slash", KEY_SLASH},

    // keypad
    {"Numpad0", KEY_KP0},
    {"Numpad1", KEY_KP1},
    {"Numpad2", KEY_KP2},
    {"Numpad3", KEY_KP3},
    {"Numpad4", KEY_KP4},
    {"Numpad5", KEY_KP5},
    {"Numpad6", KEY_KP6},
    {"Numpad7", KEY_KP7},
    {"Numpad8", KEY_KP8},
    {"Numpad9", KEY_KP9},
    {"NumpadComma", KEY_KPCOMMA},
    {"NumpadDecimal", KEY_KPDOT},
    {"NumpadEqual", KEY_KPEQUAL},
    {"NumpadSubtract", KEY_KPMINUS},
    {"NumpadMultiply", KEY_KPASTERISK},
    {"NumpadAdd", KEY_KPPLUS},
    {"NumpadDivide", KEY_KPSLASH},

    // special
    {"Backspace", KEY_BACKSPACE},
    {"NumpadEnter", KEY_KPENTER},
    {"Escape", KEY_ESC},
    {"Delete", KEY_DELETE},
    {"Enter", KEY_ENTER},
    {"Space", KEY_SPACE},
    {"Tab", KEY_TAB},

    // function
    {"F1", KEY_F1},
    {"F2", KEY_F2},
    {"F3", KEY_F3},
    {"F4", KEY_F4},
    {"F5", KEY_F5},
    {"F6", KEY_F6},
    {"F7", KEY_F7},
    {"F8", KEY_F8},
    {"F9", KEY_F9},
    {"F10", KEY_F10},
    {"F11", KEY_F11},
    {"F12", KEY_F12},

    // cursor
    {"ArrowUp", KEY_UP},
    {"ArrowDown", KEY_DOWN},
    {"ArrowLeft", KEY_LEFT},
    {"ArrowRight", KEY_RIGHT},

    {"PageUp", KEY_PAGEUP},
    {"PageDown", KEY_PAGEDOWN},
    {"Home", KEY_HOME},
    {"End", KEY_END},

    // modifiers
    {"CapsLock", KEY_CAPSLOCK},
    {"MetaLeft", KEY_LEFTMETA},
    {"MetaRight", KEY_RIGHTMETA},
    {"ControlLeft", KEY_LEFTCTRL},
    {"ControlRight", KEY_RIGHTCTRL},
    {"Fn", KEY_FN},
    {"AltLeft", KEY_LEFTALT},
    {"AltRight", KEY_RIGHTALT},
    {"ShiftLeft", KEY_LEFTSHIFT},
    {"ShiftRight", KEY_RIGHTSHIFT},
};

static struct {
    std::string jsKeycode;
    char asciiChar;
    char shiftedAsciiChar;
} char_mappings[] = {
    // alphabet
    {"KeyA", 'a', 'A'},
    {"KeyB", 'b', 'B'},
    {"KeyC", 'c', 'C'},
    {"KeyD", 'd', 'D'},
    {"KeyE", 'e', 'E'},
    {"KeyF", 'f', 'F'},
    {"KeyG", 'g', 'G'},
    {"KeyH", 'h', 'H'},
    {"KeyI", 'i', 'I'},
    {"KeyJ", 'j', 'J'},
    {"KeyK", 'k', 'K'},
    {"KeyL", 'l', 'L'},
    {"KeyM", 'm', 'M'},
    {"KeyN", 'n', 'N'},
    {"KeyO", 'o', 'O'},
    {"KeyP", 'p', 'P'},
    {"KeyQ", 'q', 'Q'},
    {"KeyR", 'r', 'R'},
    {"KeyS", 's', 'S'},
    {"KeyT", 't', 'T'},
    {"KeyU", 'u', 'U'},
    {"KeyV", 'v', 'V'},
    {"KeyW", 'w', 'W'},
    {"KeyX", 'x', 'X'},
    {"KeyY", 'y', 'Y'},
    {"KeyZ", 'z', 'Z'},

    // number row with shift mappings
    {"Digit0", '0', ')'},
    {"Digit1", '1', '!'},
    {"Digit2", '2', '@'},
    {"Digit3", '3', '#'},
    {"Digit4", '4', '$'},
    {"Digit5", '5', '%'},
    {"Digit6", '6', '^'},
    {"Digit7", '7', '&'},
    {"Digit8", '8', '*'},
    {"Digit9", '9', '('},

    // symbols with shift
    {"Backquote", '`', '~'},
    {"Backslash", '\\', '|'},
    {"BracketLeft", '[', '{'},
    {"BracketRight", ']', '}'},
    {"Comma", ',', '<'},
    {"Period", '.', '>'},
    {"Equal", '=', '+'},
    {"Minus", '-', '_'},
    {"Quote", '\'', '"'},
    {"Semicolon", ';', ':'},
    {"Slash", '/', '?'},
};

KeySym js_key_to_fcitx_keysym(const std::string &key, const std::string &code,
                              uint32_t modifiers) {
    for (const auto &pair : sym_mappings) {
        if (pair.jsCode == code) {
            return pair.sym;
        }
    }
    if (key.size() == 1) {
        return Key::keySymFromUnicode(key[0]);
    }
    // On macOS, a KeyEvent with Alt has non-ASCII sym. We map the same way with
    // fcitx5-macos.
    if (modifiers & uint32_t(KeyState::Alt)) {
        for (const auto &pair : char_mappings) {
            if (pair.jsKeycode == code) {
                return Key::keySymFromUnicode(
                    (modifiers & uint32_t(KeyState::Shift))
                        ? pair.shiftedAsciiChar
                        : pair.asciiChar);
            }
        }
    }
    FCITX_ERROR() << "Unrecognized key " << key << " " << code;
    return {};
}

uint16_t js_keycode_to_fcitx_keycode(const std::string &code) {
    for (const auto &pair : code_mappings) {
        if (pair.jsKeycode == code) {
            return pair.linuxKeycode + 8 /* evdev offset */;
        }
    }
    return 0;
}

Key js_key_to_fcitx_key(const std::string &key, const std::string &code,
                        uint32_t modifiers) {
    return Key{js_key_to_fcitx_keysym(key, code, modifiers),
               KeyStates{modifiers}, js_keycode_to_fcitx_keycode(code)};
}

extern "C" {
EMSCRIPTEN_KEEPALIVE const char *
js_key_to_fcitx_string(const char *key, const char *code, uint32_t modifiers) {
    static std::string ret;
    ret = js_key_to_fcitx_key(key, code, modifiers).normalize().toString();
    return ret.c_str();
}
}
} // namespace fcitx
