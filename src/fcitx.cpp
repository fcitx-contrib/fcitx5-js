#include "../wasmfrontend/wasmfrontend.h"
#include "../webpanel/webpanel.h"
#include "keyboard.h"
#include "keycode.h"
#include <emscripten.h>
#include <fcitx/instance.h>

namespace fcitx {

KeyboardEngineFactory keyboardFactory;
WasmFrontendFactory wasmFrontendFactory;
WebPanelFactory webPanelFactory;
StaticAddonRegistry staticAddons = {
    std::make_pair<std::string, AddonFactory *>("keyboard", &keyboardFactory),
    std::make_pair<std::string, AddonFactory *>("wasmfrontend",
                                                &wasmFrontendFactory),
    std::make_pair<std::string, AddonFactory *>("webpanel", &webPanelFactory)};

std::unique_ptr<Instance> instance;
WasmFrontend *frontend;

extern "C" {

EMSCRIPTEN_KEEPALIVE void focus_in() { frontend->focusIn(); }

EMSCRIPTEN_KEEPALIVE void focus_out() { frontend->focusOut(); }

EMSCRIPTEN_KEEPALIVE bool process_key(const char *key, const char *code,
                                      uint32_t modifiers, bool isRelease) {
    return frontend->keyEvent(js_key_to_fcitx_key(key, code, modifiers),
                              isRelease);
}

int main() {
    Log::setLogRule("*=5,notimedate");
    instance = std::make_unique<Instance>(0, nullptr);
    auto &addonMgr = instance->addonManager();
    addonMgr.registerDefaultLoader(&staticAddons);
    instance->exec();
    frontend = dynamic_cast<WasmFrontend *>(addonMgr.addon("wasmfrontend"));
    instance->setCurrentInputMethod("hallelujah");
    return 0;
}
}
} // namespace fcitx
