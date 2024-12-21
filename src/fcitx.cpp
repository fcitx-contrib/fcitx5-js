#include "../wasmfrontend/wasmfrontend.h"
#include "event_js.h"
#include "keycode.h"
#include <emscripten.h>
#include <fcitx-utils/event.h>
#include <fcitx-utils/standardpath.h>
#include <fcitx/inputmethodmanager.h>
#include <fcitx/instance.h>
#include <sys/stat.h>

FCITX_DEFINE_STATIC_ADDON_REGISTRY(getStaticAddon)

namespace fcitx {

std::unique_ptr<Instance> instance;
WasmFrontend *frontend;

extern "C" {

EMSCRIPTEN_KEEPALIVE void focus_in() { frontend->focusIn(); }

EMSCRIPTEN_KEEPALIVE void focus_out() { frontend->focusOut(); }

EMSCRIPTEN_KEEPALIVE void reset_input() { frontend->resetInput(); }

EMSCRIPTEN_KEEPALIVE bool process_key(const char *key, const char *code,
                                      uint32_t modifiers, bool isRelease) {
    return frontend->keyEvent(js_key_to_fcitx_key(key, code, modifiers),
                              isRelease);
}

EMSCRIPTEN_KEEPALIVE void reload() {
    instance->reloadConfig();
    instance->refresh();
    auto &addonManager = instance->addonManager();
    for (const auto category :
         {fcitx::AddonCategory::InputMethod, fcitx::AddonCategory::Frontend,
          fcitx::AddonCategory::Loader, fcitx::AddonCategory::Module,
          fcitx::AddonCategory::UI}) {
        const auto names = addonManager.addonNames(category);
        for (const auto &name : names) {
            instance->reloadAddonConfig(name);
        }
    }
    instance->inputMethodManager().load();
}

int main() {
    umask(007); // Fix config file's mode
    StandardPath::global().syncUmask();
#ifdef NDEBUG
    Log::setLogRule("*=4,notimedate");
#else
    Log::setLogRule("*=5,notimedate");
#endif
    EventLoop::setEventLoopFactory(
        [] { return std::make_unique<JSEventLoop>(); });
    instance = std::make_unique<Instance>(0, nullptr);
    auto &addonMgr = instance->addonManager();
    addonMgr.registerDefaultLoader(&getStaticAddon());
    instance->exec();
    frontend = dynamic_cast<WasmFrontend *>(addonMgr.addon("wasmfrontend"));
    return 0;
}
}
} // namespace fcitx
