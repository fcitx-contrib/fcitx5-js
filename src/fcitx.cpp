#include "../wasmfrontend/wasmfrontend.h"
#include <emscripten.h>
#include <fcitx/instance.h>
#include <iostream>

using namespace fcitx;

WasmFrontendFactory wasmFrontendFactory;
StaticAddonRegistry staticAddons = {std::make_pair<std::string, AddonFactory *>(
    "wasmfrontend", &wasmFrontendFactory)};

std::unique_ptr<Instance> instance;
WasmFrontend *frontend;

extern "C" {

EMSCRIPTEN_KEEPALIVE void focus_in() { frontend->focusIn(); }

EMSCRIPTEN_KEEPALIVE void focus_out() { frontend->focusOut(); }

EMSCRIPTEN_KEEPALIVE bool process_key(const char *sym) {
    uint32_t unicode = sym[0];
    auto key = Key{Key::keySymFromUnicode(unicode)};
    return frontend->keyEvent(key);
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
