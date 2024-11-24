#include "../wasmfrontend/wasmfrontend.h"
#include "event_js.h"
#include "keycode.h"
#include <emscripten.h>
#include <fcitx-utils/event.h>
#include <fcitx-utils/standardpath.h>
#include <fcitx/instance.h>
#include <sys/stat.h>

namespace fcitx {

StaticAddonRegistry staticAddons;

FCITX_IMPORT_ADDON_FACTORY(staticAddons, keyboard);
FCITX_IMPORT_ADDON_FACTORY(staticAddons, wasmfrontend);
FCITX_IMPORT_ADDON_FACTORY(staticAddons, webpanel);

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
    umask(007); // Fix config file's mode
    StandardPath::global().syncUmask();
    Log::setLogRule("*=5,notimedate");
    EventLoop::setEventLoopFactory(
        [] { return std::make_unique<JSEventLoop>(); });
    instance = std::make_unique<Instance>(0, nullptr);
    auto &addonMgr = instance->addonManager();
    addonMgr.registerDefaultLoader(&staticAddons);
    instance->exec();
    frontend = dynamic_cast<WasmFrontend *>(addonMgr.addon("wasmfrontend"));
    return 0;
}
}
} // namespace fcitx
